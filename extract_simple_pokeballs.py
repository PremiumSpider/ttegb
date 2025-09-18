#!/usr/bin/env python3
"""
Simple Pokéball sprite extractor that only uses PIL (no numpy required).
"""

from PIL import Image
import os

def extract_pokeball_sprites_simple(input_image_path, output_dir="final_pokeball_sprites"):
    """
    Extract sprites using only PIL, no numpy required.
    """
    
    # Create output directory
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        # Open the sprite sheet
        sprite_sheet = Image.open(input_image_path)
        print(f"Loaded sprite sheet: {sprite_sheet.size}")
        
        width, height = sprite_sheet.size
        
        # Based on the layout: 8 columns, 4 rows (with last row having only 2 sprites)
        cols = 8
        rows = 4
        
        sprite_width = width // cols
        sprite_height = height // rows
        
        print(f"Sprite dimensions: {sprite_width}x{sprite_height}")
        
        sprites_extracted = 0
        
        # Extract first 3 full rows (24 sprites)
        for row in range(3):
            for col in range(cols):
                left = col * sprite_width
                top = row * sprite_height
                right = left + sprite_width
                bottom = top + sprite_height
                
                # Crop the sprite
                sprite = sprite_sheet.crop((left, top, right, bottom))
                
                # Save the sprite
                sprites_extracted += 1
                output_path = os.path.join(output_dir, f"pokeball_{sprites_extracted:02d}.png")
                sprite.save(output_path)
                print(f"Saved sprite {sprites_extracted}: {output_path}")
        
        # Extract the last 2 sprites from the bottom row
        # They appear to be centered in the bottom row
        bottom_row_y = 3 * sprite_height
        
        # Calculate positions for the 2 remaining sprites
        # Assuming they're centered with the same spacing
        remaining_sprites = 2
        total_width_needed = remaining_sprites * sprite_width
        start_x = (width - total_width_needed) // 2
        
        for i in range(remaining_sprites):
            left = start_x + (i * sprite_width)
            top = bottom_row_y
            right = left + sprite_width
            bottom = top + sprite_height
            
            # Crop the sprite
            sprite = sprite_sheet.crop((left, top, right, bottom))
            
            # Save the sprite
            sprites_extracted += 1
            output_path = os.path.join(output_dir, f"pokeball_{sprites_extracted:02d}.png")
            sprite.save(output_path)
            print(f"Saved sprite {sprites_extracted}: {output_path}")
        
        print(f"\n✅ Successfully extracted {sprites_extracted} Pokéball sprites!")
        return sprites_extracted
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find input image '{input_image_path}'")
        return 0
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return 0

def main():
    print("Simple Pokéball Sprite Extractor")
    print("=" * 40)
    
    # Look for the user's image file
    possible_files = [
        "Screenshot 2025-09-17 184034.png",  # User's actual sprite sheet
        "user_pokeball_sheet.png",
        "pokeball_sheet.png", 
        "pokeballs.png",
        "sprite_sheet.png",
        "pokeball_spritesheet.png"
    ]
    
    input_file = None
    for filename in possible_files:
        if os.path.exists(filename):
            input_file = filename
            print(f"Found image file: {filename}")
            break
    
    if not input_file:
        print("❌ Could not find sprite sheet image.")
        print("Please save your Pokéball sprite sheet as one of these names:")
        for name in possible_files:
            print(f"  - {name}")
        return
    
    sprite_count = extract_pokeball_sprites_simple(input_file)
    
    if sprite_count == 26:
        print(f"\n🎉 Perfect! Extracted all {sprite_count} Pokéball sprites!")
        print("Check the 'final_pokeball_sprites' directory for your individual sprites.")
    elif sprite_count > 0:
        print(f"\n⚠️  Extracted {sprite_count} sprites (expected 26)")
    else:
        print("\n❌ Failed to extract sprites")

if __name__ == "__main__":
    main()
