"""
PDF Thumbnail Generation Utility

This module provides functionality to generate thumbnail images from PDF files
for research papers in the LawFort application.
"""

import os
import io
import logging
from typing import Optional, Tuple
from PIL import Image
import PyPDF2


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFThumbnailGenerator:
    """
    A utility class for generating thumbnails from PDF files.
    """
    
    def __init__(self, thumbnail_width: int = 400, thumbnail_height: int = 250, quality: int = 85):
        """
        Initialize the PDF thumbnail generator.
        
        Args:
            thumbnail_width (int): Width of the generated thumbnail
            thumbnail_height (int): Height of the generated thumbnail
            quality (int): JPEG quality for the thumbnail (1-100)
        """
        self.thumbnail_width = thumbnail_width
        self.thumbnail_height = thumbnail_height
        self.quality = quality
        
    def generate_thumbnail(self, pdf_path: str, output_path: str) -> Tuple[bool, Optional[str]]:
        """
        Generate a thumbnail image from the first page of a PDF file.
        
        Args:
            pdf_path (str): Path to the source PDF file
            output_path (str): Path where the thumbnail should be saved
            
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            # Check if PDF file exists
            if not os.path.exists(pdf_path):
                return False, f"PDF file not found: {pdf_path}"
            
            # Create output directory if it doesn't exist
            output_dir = os.path.dirname(output_path)
            os.makedirs(output_dir, exist_ok=True)
            
            # Try to use pdf2image first (better quality)
            try:
                from pdf2image import convert_from_path

                # For Windows, we might need to specify poppler path
                # Try to load local poppler config first, then fallback to common paths
                poppler_paths = [None]  # Start with system PATH

                # Try to load local poppler configuration
                try:
                    from poppler_config import POPPLER_PATH
                    poppler_paths.insert(0, POPPLER_PATH)  # Try local config first
                    logger.info(f"Using local poppler installation: {POPPLER_PATH}")
                except ImportError:
                    logger.info("No local poppler config found, trying system paths")

                # Add common Windows paths as fallbacks
                poppler_paths.extend([
                    os.path.join(os.path.dirname(__file__), "..", "poppler-24.08.0", "Library", "bin"),  # Your specific installation in Backend folder
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), "poppler-24.08.0", "Library", "bin"),  # Alternative path
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), "poppler", "bin"),  # Generic local installation
                    r"C:\Program Files\poppler\bin",
                    r"C:\Program Files (x86)\poppler\bin",
                    r"C:\poppler\bin"
                ])

                pages = None
                for poppler_path in poppler_paths:
                    try:
                        logger.info(f"Trying poppler path: {poppler_path}")
                        if poppler_path and os.path.exists(poppler_path):
                            logger.info(f"Path exists, attempting conversion with: {poppler_path}")
                            # Use higher DPI for better quality and enable transparency
                            pages = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=300, poppler_path=poppler_path, fmt='PNG')
                        elif not poppler_path:
                            logger.info("Trying system PATH")
                            # Use higher DPI for better quality and enable transparency
                            pages = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=300, fmt='PNG')
                        else:
                            logger.warning(f"Path does not exist: {poppler_path}")
                            continue

                        logger.info(f"SUCCESS: Generated thumbnail using poppler path: {poppler_path}")
                        break  # If successful, break out of the loop
                    except Exception as e:
                        logger.warning(f"Failed with poppler path {poppler_path}: {str(e)}")
                        continue

                if pages:
                    # Get the first page
                    page_image = pages[0]

                    # Apply intelligent cropping and scaling
                    thumbnail = self._create_smart_thumbnail(page_image)

                    # Save as JPEG with high quality
                    thumbnail.save(output_path, 'JPEG', quality=95, optimize=True)

                    logger.info(f"Thumbnail generated successfully using pdf2image: {output_path}")
                    return True, None
                else:
                    logger.warning("pdf2image failed to convert PDF, falling back to PyPDF2 method")
                    return self._generate_with_pypdf2(pdf_path, output_path)

            except ImportError:
                # Fallback to PyPDF2 + PIL approach
                logger.warning("pdf2image not available, falling back to PyPDF2 method")
                return self._generate_with_pypdf2(pdf_path, output_path)
            except Exception as pdf2image_error:
                # If pdf2image fails for any reason, fallback to PyPDF2
                logger.warning(f"pdf2image failed: {str(pdf2image_error)}, falling back to PyPDF2 method")
                return self._generate_with_pypdf2(pdf_path, output_path)
                
        except Exception as e:
            error_msg = f"Error generating thumbnail: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def _generate_with_pypdf2(self, pdf_path: str, output_path: str) -> Tuple[bool, Optional[str]]:
        """
        Fallback method using PyPDF2 (creates a simple placeholder).
        
        Args:
            pdf_path (str): Path to the source PDF file
            output_path (str): Path where the thumbnail should be saved
            
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            # Read PDF to verify it's valid
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                if len(pdf_reader.pages) == 0:
                    return False, "PDF has no pages"
                
                # Get first page to extract some text for the placeholder
                first_page = pdf_reader.pages[0]
                text = first_page.extract_text()[:100] if first_page.extract_text() else "Research Paper"
                
            # Create a simple placeholder thumbnail
            placeholder = self._create_placeholder_thumbnail(text)
            placeholder.save(output_path, 'JPEG', quality=95, optimize=True)
            
            logger.info(f"Placeholder thumbnail generated using PyPDF2: {output_path}")
            return True, None
            
        except Exception as e:
            error_msg = f"Error with PyPDF2 fallback: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def _create_smart_thumbnail(self, image: Image.Image) -> Image.Image:
        """
        Create a smart thumbnail with intelligent cropping and scaling.

        Args:
            image (Image.Image): Source PDF page image

        Returns:
            Image.Image: Processed thumbnail image
        """
        try:
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Step 1: Detect and crop content area (remove excessive white margins)
            cropped_image = self._auto_crop_content(image)

            # Step 2: Scale to fill thumbnail width while maintaining aspect ratio
            scaled_image = self._scale_to_fill_width(cropped_image)

            # Step 3: Apply final cropping to exact thumbnail dimensions
            final_thumbnail = self._crop_to_thumbnail_size(scaled_image)

            # Step 4: Apply sharpening filter for better text readability
            final_thumbnail = self._enhance_readability(final_thumbnail)

            return final_thumbnail

        except Exception as e:
            logger.warning(f"Smart thumbnail processing failed: {e}, falling back to simple resize")
            return self._resize_image(image)

    def _auto_crop_content(self, image: Image.Image) -> Image.Image:
        """
        Automatically detect and crop the content area, removing excessive white margins.

        Args:
            image (Image.Image): Source image

        Returns:
            Image.Image: Cropped image focusing on content
        """
        try:
            # Try numpy-based approach first
            try:
                import numpy as np

                # Convert PIL image to numpy array for analysis
                img_array = np.array(image)

                # Convert to grayscale for edge detection
                if len(img_array.shape) == 3:
                    gray = np.mean(img_array, axis=2)
                else:
                    gray = img_array

                # Find content boundaries by detecting non-white areas
                # Consider pixels with value < 250 as content (not pure white)
                content_mask = gray < 250

                # Find bounding box of content
                rows = np.any(content_mask, axis=1)
                cols = np.any(content_mask, axis=0)

                if not np.any(rows) or not np.any(cols):
                    # If no content detected, return original with minimal crop
                    margin = min(image.width, image.height) // 20
                    return image.crop((margin, margin, image.width - margin, image.height - margin))

                # Get content boundaries
                top, bottom = np.where(rows)[0][[0, -1]]
                left, right = np.where(cols)[0][[0, -1]]

                # Add minimal padding around content (2% of image dimensions for tighter crop)
                padding_x = max(5, int(image.width * 0.02))
                padding_y = max(5, int(image.height * 0.02))

                # Ensure boundaries are within image limits
                left = max(0, left - padding_x)
                top = max(0, top - padding_y)
                right = min(image.width, right + padding_x)
                bottom = min(image.height, bottom + padding_y)

                # Crop to content area
                cropped = image.crop((left, top, right, bottom))

                logger.info(f"Auto-cropped from {image.size} to {cropped.size}")
                return cropped

            except ImportError:
                logger.info("NumPy not available, using PIL-based cropping")
                # Fallback to PIL-based approach
                return self._auto_crop_content_pil(image)

        except Exception as e:
            logger.warning(f"Auto-crop failed: {e}, using minimal crop")
            # Fallback: minimal crop to remove obvious margins
            margin_x = image.width // 10
            margin_y = image.height // 10
            return image.crop((margin_x, margin_y, image.width - margin_x, image.height - margin_y))

    def _auto_crop_content_pil(self, image: Image.Image) -> Image.Image:
        """
        PIL-based content detection and cropping (fallback when numpy is not available).

        Args:
            image (Image.Image): Source image

        Returns:
            Image.Image: Cropped image focusing on content
        """
        try:
            # Convert to grayscale for analysis
            gray = image.convert('L')

            # Get image data
            width, height = gray.size
            pixels = list(gray.getdata())

            # Find content boundaries by scanning for non-white pixels
            # Consider pixels with value < 250 as content (not pure white)
            content_threshold = 250

            # Find top boundary
            top = 0
            for y in range(height):
                row_start = y * width
                row_pixels = pixels[row_start:row_start + width]
                if any(pixel < content_threshold for pixel in row_pixels):
                    top = y
                    break

            # Find bottom boundary
            bottom = height - 1
            for y in range(height - 1, -1, -1):
                row_start = y * width
                row_pixels = pixels[row_start:row_start + width]
                if any(pixel < content_threshold for pixel in row_pixels):
                    bottom = y
                    break

            # Find left boundary
            left = 0
            for x in range(width):
                col_pixels = [pixels[y * width + x] for y in range(height)]
                if any(pixel < content_threshold for pixel in col_pixels):
                    left = x
                    break

            # Find right boundary
            right = width - 1
            for x in range(width - 1, -1, -1):
                col_pixels = [pixels[y * width + x] for y in range(height)]
                if any(pixel < content_threshold for pixel in col_pixels):
                    right = x
                    break

            # Add minimal padding around content (2% of image dimensions for tighter crop)
            padding_x = max(5, int(width * 0.02))
            padding_y = max(5, int(height * 0.02))

            # Ensure boundaries are within image limits
            left = max(0, left - padding_x)
            top = max(0, top - padding_y)
            right = min(width, right + padding_x)
            bottom = min(height, bottom + padding_y)

            # Crop to content area
            cropped = image.crop((left, top, right, bottom))

            logger.info(f"PIL auto-cropped from {image.size} to {cropped.size}")
            return cropped

        except Exception as e:
            logger.warning(f"PIL auto-crop failed: {e}, using minimal crop")
            # Fallback: minimal crop to remove obvious margins
            margin_x = image.width // 10
            margin_y = image.height // 10
            return image.crop((margin_x, margin_y, image.width - margin_x, image.height - margin_y))

    def _scale_to_fill_width(self, image: Image.Image) -> Image.Image:
        """
        Scale image to fit the thumbnail width exactly without over-zooming.

        Args:
            image (Image.Image): Source image

        Returns:
            Image.Image: Scaled image that fits the width
        """
        # Calculate scale factor to fit width exactly (no additional zoom)
        scale_factor = self.thumbnail_width / image.width

        # Calculate new dimensions
        new_width = self.thumbnail_width  # Exact width fit
        new_height = int(image.height * scale_factor)

        # Resize with high-quality resampling
        scaled = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        logger.info(f"Scaled from {image.size} to {scaled.size} (fit to width: {self.thumbnail_width}px)")
        return scaled

    def _crop_to_thumbnail_size(self, image: Image.Image) -> Image.Image:
        """
        Crop the scaled image to exact thumbnail dimensions starting from the top.

        Args:
            image (Image.Image): Scaled image

        Returns:
            Image.Image: Final thumbnail with exact dimensions
        """
        # Since we're scaling to fill width with zoom, the image will likely be larger than thumbnail
        if image.width >= self.thumbnail_width and image.height >= self.thumbnail_height:
            # Calculate crop position to shift content slightly left for better centering
            center_x = (image.width - self.thumbnail_width) // 2
            # Shift left by 10% of the available margin to center content better
            left_shift = int(center_x * 0.1)
            crop_x = max(0, center_x - left_shift)  # Shift slightly left from center
            crop_y = 0  # Start from the very top of the page to show title

            # Ensure we don't crop beyond image boundaries
            crop_x = max(0, min(crop_x, image.width - self.thumbnail_width))
            crop_y = max(0, min(crop_y, image.height - self.thumbnail_height))

            # Crop to exact thumbnail dimensions
            thumbnail = image.crop((
                crop_x,
                crop_y,
                crop_x + self.thumbnail_width,
                crop_y + self.thumbnail_height
            ))

            logger.info(f"Cropped from {image.size} to {thumbnail.size} at position ({crop_x}, {crop_y}) - shifted left by {left_shift}px from center")
            return thumbnail

        else:
            # Image is smaller than thumbnail (unlikely with our zoom), center it
            thumbnail = Image.new('RGB', (self.thumbnail_width, self.thumbnail_height), 'white')
            x_offset = (self.thumbnail_width - image.width) // 2
            y_offset = (self.thumbnail_height - image.height) // 2
            thumbnail.paste(image, (x_offset, y_offset))
            return thumbnail

    def _enhance_readability(self, image: Image.Image) -> Image.Image:
        """
        Apply enhancements to improve text readability.

        Args:
            image (Image.Image): Source image

        Returns:
            Image.Image: Enhanced image
        """
        try:
            from PIL import ImageEnhance, ImageFilter

            # Apply subtle sharpening
            enhanced = image.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))

            # Slightly increase contrast for better text readability
            contrast_enhancer = ImageEnhance.Contrast(enhanced)
            enhanced = contrast_enhancer.enhance(1.1)

            return enhanced

        except Exception as e:
            logger.warning(f"Enhancement failed: {e}")
            return image

    def _resize_image(self, image: Image.Image) -> Image.Image:
        """
        Resize image to thumbnail size while maintaining aspect ratio.
        
        Args:
            image (Image.Image): Source image
            
        Returns:
            Image.Image: Resized thumbnail image
        """
        # Calculate aspect ratio
        aspect_ratio = image.width / image.height
        target_ratio = self.thumbnail_width / self.thumbnail_height
        
        if aspect_ratio > target_ratio:
            # Image is wider, fit to width
            new_width = self.thumbnail_width
            new_height = int(self.thumbnail_width / aspect_ratio)
        else:
            # Image is taller, fit to height
            new_height = self.thumbnail_height
            new_width = int(self.thumbnail_height * aspect_ratio)
        
        # Resize image
        resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create final thumbnail with exact dimensions (add padding if needed)
        thumbnail = Image.new('RGB', (self.thumbnail_width, self.thumbnail_height), 'white')
        
        # Center the resized image
        x_offset = (self.thumbnail_width - new_width) // 2
        y_offset = (self.thumbnail_height - new_height) // 2
        
        thumbnail.paste(resized, (x_offset, y_offset))
        
        return thumbnail
    
    def _create_placeholder_thumbnail(self, text: str) -> Image.Image:
        """
        Create a placeholder thumbnail that looks like an actual research paper page.

        Args:
            text (str): Text to display on the placeholder

        Returns:
            Image.Image: Placeholder thumbnail image
        """
        # Create a white background to simulate a paper page
        thumbnail = Image.new('RGB', (self.thumbnail_width, self.thumbnail_height), '#ffffff')

        try:
            from PIL import ImageDraw, ImageFont

            draw = ImageDraw.Draw(thumbnail)

            # Try to use system fonts with different sizes
            try:
                title_font = ImageFont.truetype("arial.ttf", 16)
                author_font = ImageFont.truetype("arial.ttf", 11)
                text_font = ImageFont.truetype("arial.ttf", 9)
                small_font = ImageFont.truetype("arial.ttf", 8)
            except:
                title_font = ImageFont.load_default()
                author_font = ImageFont.load_default()
                text_font = ImageFont.load_default()
                small_font = ImageFont.load_default()

            # Add a subtle shadow/border to simulate paper depth
            shadow_color = '#f3f4f6'
            draw.rectangle([2, 2, self.thumbnail_width, self.thumbnail_height], fill=shadow_color)
            draw.rectangle([0, 0, self.thumbnail_width-2, self.thumbnail_height-2], fill='white', outline='#e5e7eb')

            # Simulate realistic research paper layout
            y_pos = 15
            margin = 12
            line_height = 10

            # Extract meaningful title from text or use default
            if text and len(text) > 20:
                # Try to extract what looks like a title (first sentence or first few words)
                sentences = text.split('.')
                if sentences and len(sentences[0]) > 10:
                    title_text = sentences[0][:60] + ("..." if len(sentences[0]) > 60 else "")
                else:
                    words = text.split()[:10]
                    title_text = ' '.join(words)
                    if len(title_text) > 50:
                        title_text = title_text[:50] + "..."
            else:
                title_text = "Advancing Research in Legal Technology and Innovation"

            # Draw title (centered, bold-looking)
            title_lines = []
            words = title_text.split()
            current_line = ""

            for word in words:
                test_line = current_line + (" " if current_line else "") + word
                bbox = draw.textbbox((0, 0), test_line, font=title_font)
                if bbox[2] - bbox[0] < self.thumbnail_width - 2 * margin:
                    current_line = test_line
                else:
                    if current_line:
                        title_lines.append(current_line)
                        current_line = word
                    else:
                        title_lines.append(word)

            if current_line:
                title_lines.append(current_line)

            # Draw title lines (centered)
            for line in title_lines[:3]:  # Max 3 lines for title
                bbox = draw.textbbox((0, 0), line, font=title_font)
                text_width = bbox[2] - bbox[0]
                x_pos = (self.thumbnail_width - text_width) // 2

                # Bold effect by drawing multiple times
                for offset in [(0,0), (1,0), (0,1)]:
                    draw.text((x_pos + offset[0], y_pos + offset[1]), line,
                             fill='#111827', font=title_font)
                y_pos += 18

            y_pos += 8

            # Draw authors (centered)
            authors = "John Smith, Jane Doe, Research Team"
            bbox = draw.textbbox((0, 0), authors, font=author_font)
            text_width = bbox[2] - bbox[0]
            x_pos = (self.thumbnail_width - text_width) // 2
            draw.text((x_pos, y_pos), authors, fill='#374151', font=author_font)
            y_pos += 20

            # Draw institution/affiliation (centered)
            institution = "University Research Institute"
            bbox = draw.textbbox((0, 0), institution, font=text_font)
            text_width = bbox[2] - bbox[0]
            x_pos = (self.thumbnail_width - text_width) // 2
            draw.text((x_pos, y_pos), institution, fill='#6b7280', font=text_font)
            y_pos += 25

            # Draw "ABSTRACT" header (centered)
            abstract_header = "ABSTRACT"
            bbox = draw.textbbox((0, 0), abstract_header, font=text_font)
            text_width = bbox[2] - bbox[0]
            x_pos = (self.thumbnail_width - text_width) // 2
            draw.text((x_pos, y_pos), abstract_header, fill='#111827', font=text_font)
            y_pos += 18

            # Draw abstract text (justified)
            abstract_text = ("This research presents innovative approaches to legal technology, "
                           "examining the intersection of artificial intelligence and legal practice. "
                           "Our methodology incorporates advanced computational techniques to analyze "
                           "legal documents and provide insights for practitioners. The findings "
                           "demonstrate significant improvements in efficiency and accuracy.")

            # Break abstract into lines
            words = abstract_text.split()
            current_line = ""

            for word in words:
                test_line = current_line + (" " if current_line else "") + word
                bbox = draw.textbbox((0, 0), test_line, font=small_font)

                if bbox[2] - bbox[0] < self.thumbnail_width - 2 * margin:
                    current_line = test_line
                else:
                    if current_line:
                        draw.text((margin, y_pos), current_line, fill='#4b5563', font=small_font)
                        y_pos += line_height
                        current_line = word

                    if y_pos > self.thumbnail_height - 30:
                        break

            if current_line and y_pos <= self.thumbnail_height - 30:
                draw.text((margin, y_pos), current_line, fill='#4b5563', font=small_font)
                y_pos += line_height

            # Add some more paragraph lines to simulate content
            remaining_lines = max(0, (self.thumbnail_height - y_pos - 20) // line_height)
            for i in range(min(remaining_lines, 8)):
                line_width = self.thumbnail_width - 2 * margin - (i % 3) * 15
                draw.rectangle([margin, y_pos + 3, margin + line_width, y_pos + 4],
                             fill='#d1d5db')
                y_pos += line_height

            # Add a small "PDF" indicator in the top-right corner
            pdf_x = self.thumbnail_width - 30
            pdf_y = 8
            draw.rectangle([pdf_x, pdf_y, pdf_x + 22, pdf_y + 12],
                         fill='#dc2626', outline='#b91c1c')
            draw.text((pdf_x + 2, pdf_y + 1), "PDF", fill='white', font=small_font)

        except ImportError:
            # If PIL drawing is not available, just return white background
            pass

        return thumbnail

def generate_research_paper_thumbnail(pdf_path: str, content_id: int, user_id: int) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Generate a thumbnail for a research paper PDF.
    
    Args:
        pdf_path (str): Path to the PDF file
        content_id (int): Content ID for the research paper
        user_id (int): User ID who uploaded the paper
        
    Returns:
        Tuple[bool, Optional[str], Optional[str]]: (success, thumbnail_url, error_message)
    """
    try:
        # Create thumbnail filename
        timestamp = str(int(os.path.getmtime(pdf_path))) if os.path.exists(pdf_path) else "unknown"
        thumbnail_filename = f"research_paper_{user_id}_{content_id}_{timestamp}.jpg"
        
        # Create thumbnail directory
        thumbnail_dir = os.path.join(os.getcwd(), 'uploads', 'thumbnails', 'research_papers')
        os.makedirs(thumbnail_dir, exist_ok=True)
        
        # Full path for thumbnail
        thumbnail_path = os.path.join(thumbnail_dir, thumbnail_filename)
        
        # Generate thumbnail
        generator = PDFThumbnailGenerator()
        success, error = generator.generate_thumbnail(pdf_path, thumbnail_path)
        
        if success:
            # Generate URL for the thumbnail
            thumbnail_url = f"http://localhost:5000/uploads/thumbnails/research_papers/{thumbnail_filename}"
            return True, thumbnail_url, None
        else:
            return False, None, error
            
    except Exception as e:
        error_msg = f"Error in generate_research_paper_thumbnail: {str(e)}"
        logger.error(error_msg)
        return False, None, error_msg
