"""
Celery tasks for processing product media (images and videos)
Handles automatic resizing, format conversion, and optimization
"""

from celery import shared_task
from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import os
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_product_media(self, media_id):
    """
    Main task to process product media (images or videos)
    Dispatches to appropriate processing function based on media type
    """
    from apps.products.models import ProductMedia
    
    try:
        media = ProductMedia.objects.get(pk=media_id)
        media.processing_status = 'processing'
        media.save(update_fields=['processing_status'])
        
        if media.media_type == 'image':
            process_image(media)
        elif media.media_type == 'video':
            process_video(media)
        
        media.is_processed = True
        media.processing_status = 'completed'
        media.save(update_fields=['is_processed', 'processing_status', 'processed_images'])
        
        logger.info(f"Successfully processed media {media_id}")
        
    except ProductMedia.DoesNotExist:
        logger.error(f"ProductMedia {media_id} not found")
    except Exception as exc:
        logger.error(f"Error processing media {media_id}: {str(exc)}")
        media.processing_status = 'failed'
        media.processing_error = str(exc)
        media.save(update_fields=['processing_status', 'processing_error'])
        raise self.retry(exc=exc, countdown=60)


def process_image(media):
    """
    Process product image:
    1. Generate multiple sizes (thumbnail, medium, large)
    2. Convert to WebP format for optimal web performance
    3. Optionally upscale if original is too small
    """
    # Define target sizes (width, height)
    SIZES = {
        'thumbnail': (300, 300),
        'medium': (800, 800),
        'large': (1500, 1500),
    }
    
    processed_paths = {}
    
    try:
        # Open original image
        original_path = media.original_file.path
        with Image.open(original_path) as img:
            # Convert to RGB if necessary (for WebP compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Check if image needs upscaling
            original_width, original_height = img.size
            if original_width < 800 or original_height < 800:
                img = upscale_image(img)
            
            # Generate each size
            for size_name, dimensions in SIZES.items():
                processed_img = resize_image(img, dimensions)
                
                # Save as WebP
                output = BytesIO()
                processed_img.save(output, format='WEBP', quality=85, method=6)
                output.seek(0)
                
                # Generate file path
                base_name = os.path.splitext(os.path.basename(media.original_file.name))[0]
                webp_filename = f"{base_name}_{size_name}.webp"
                webp_path = os.path.join('products/processed', size_name, webp_filename)
                
                # Save to storage
                saved_path = default_storage.save(
                    webp_path,
                    ContentFile(output.read())
                )
                
                processed_paths[size_name] = default_storage.url(saved_path)
        
        # Update media object
        media.processed_images = processed_paths
        
    except Exception as e:
        logger.error(f"Error processing image {media.id}: {str(e)}")
        raise


def resize_image(img, target_size):
    """
    Resize image to target size while maintaining aspect ratio
    Uses high-quality Lanczos resampling
    """
    # Use ImageOps.fit for smart cropping to exact dimensions
    # Or use thumbnail() to maintain aspect ratio without cropping
    
    # Option 1: Exact size with smart crop (recommended for product images)
    resized = ImageOps.fit(
        img,
        target_size,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5)
    )
    
    return resized


def upscale_image(img, scale_factor=2):
    """
    Upscale small images using high-quality Lanczos algorithm
    For production, consider integrating AI upscaling libraries like:
    - waifu2x-python
    - Real-ESRGAN
    """
    new_size = (img.width * scale_factor, img.height * scale_factor)
    
    # High-quality upscaling with Lanczos
    upscaled = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Apply slight sharpening to improve perceived quality
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Sharpness(upscaled)
    upscaled = enhancer.enhance(1.2)  # 20% sharper
    
    logger.info(f"Upscaled image from {img.size} to {new_size}")
    return upscaled


@shared_task(bind=True, max_retries=3)
def process_video(media):
    """
    Process product video:
    1. Compress and optimize for web
    2. Convert to HLS or MP4
    3. Generate thumbnail
    
    Requires ffmpeg to be installed on the system
    """
    try:
        import subprocess
        
        input_path = media.original_file.path
        base_name = os.path.splitext(os.path.basename(media.original_file.name))[0]
        
        # Output paths
        output_dir = os.path.join('products/videos/processed/', base_name)
        os.makedirs(os.path.join(default_storage.location, output_dir), exist_ok=True)
        
        output_video_path = os.path.join(output_dir, f"{base_name}_optimized.mp4")
        output_thumbnail_path = os.path.join(output_dir, f"{base_name}_thumb.jpg")
        
        full_output_video = os.path.join(default_storage.location, output_video_path)
        full_output_thumbnail = os.path.join(default_storage.location, output_thumbnail_path)
        
        # Convert video to optimized MP4
        # Using H.264 codec with web-friendly settings
        video_command = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',  # Quality (lower = better, 23 is good balance)
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',  # Enable streaming
            '-vf', 'scale=1280:-2',  # Scale to max 1280px width
            '-y',  # Overwrite output
            full_output_video
        ]
        
        subprocess.run(video_command, check=True, capture_output=True)
        
        # Generate thumbnail from video (at 1 second mark)
        thumbnail_command = [
            'ffmpeg',
            '-i', input_path,
            '-ss', '00:00:01',  # Capture at 1 second
            '-vframes', '1',
            '-vf', 'scale=800:-1',
            '-y',
            full_output_thumbnail
        ]
        
        subprocess.run(thumbnail_command, check=True, capture_output=True)
        
        # Update media object
        media.processed_video.name = output_video_path
        media.video_thumbnail.name = output_thumbnail_path
        media.is_processed = True
        media.processing_status = 'completed'
        media.save()
        
        logger.info(f"Successfully processed video {media.id}")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error processing video {media.id}: {e.stderr}")
        raise
    except Exception as e:
        logger.error(f"Error processing video {media.id}: {str(e)}")
        raise


@shared_task
def cleanup_old_media():
    """
    Periodic task to clean up orphaned media files
    Run daily via Celery Beat
    """
    from apps.products.models import ProductMedia
    from datetime import timedelta
    from django.utils import timezone
    
    # Delete media marked as failed for more than 7 days
    threshold = timezone.now() - timedelta(days=7)
    old_failed = ProductMedia.objects.filter(
        processing_status='failed',
        created_at__lt=threshold
    )
    
    count = old_failed.count()
    old_failed.delete()
    
    logger.info(f"Cleaned up {count} old failed media records")
    return count
