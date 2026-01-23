<?php
/**
 * Plugin Name: Auto Image Resizer for WordPress
 * Plugin URI: https://wp.vjgp.online
 * Description: Automatically resizes images uploaded to WordPress to optimize performance. Lightweight and fast.
 * Version: 1.0.0
 * Author: WP Automation
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class WP_Auto_Image_Resizer {
    
    private $max_width = 1920;
    private $max_height = 1080;
    private $jpeg_quality = 85;
    
    public function __construct() {
        // Hook into WordPress image upload
        add_filter('wp_handle_upload_prefilter', array($this, 'resize_on_upload'));
        add_filter('jpeg_quality', array($this, 'set_jpeg_quality'));
        add_filter('wp_editor_set_quality', array($this, 'set_jpeg_quality'));
        
        // Add settings page
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Resize image on upload
     */
    public function resize_on_upload($file) {
        // Only process images
        if (strpos($file['type'], 'image') === false) {
            return $file;
        }
        
        $image_path = $file['tmp_name'];
        
        // Get image dimensions
        list($orig_width, $orig_height, $image_type) = getimagesize($image_path);
        
        // Get settings
        $max_width = get_option('air_max_width', $this->max_width);
        $max_height = get_option('air_max_height', $this->max_height);
        
        // Check if resizing is needed
        if ($orig_width <= $max_width && $orig_height <= $max_height) {
            return $file; // No resizing needed
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        $ratio = min($max_width / $orig_width, $max_height / $orig_height);
        $new_width = round($orig_width * $ratio);
        $new_height = round($orig_height * $ratio);
        
        // Create new image resource
        $new_image = imagecreatetruecolor($new_width, $new_height);
        
        // Load original image
        switch ($image_type) {
            case IMAGETYPE_JPEG:
                $source = imagecreatefromjpeg($image_path);
                break;
            case IMAGETYPE_PNG:
                $source = imagecreatefrompng($image_path);
                // Preserve transparency
                imagealphablending($new_image, false);
                imagesavealpha($new_image, true);
                break;
            case IMAGETYPE_GIF:
                $source = imagecreatefromgif($image_path);
                break;
            case IMAGETYPE_WEBP:
                $source = imagecreatefromwebp($image_path);
                break;
            default:
                return $file; // Unsupported format
        }
        
        // Resize
        imagecopyresampled($new_image, $source, 0, 0, 0, 0, $new_width, $new_height, $orig_width, $orig_height);
        
        // Save resized image
        switch ($image_type) {
            case IMAGETYPE_JPEG:
                imagejpeg($new_image, $image_path, $this->jpeg_quality);
                break;
            case IMAGETYPE_PNG:
                imagepng($new_image, $image_path, 9);
                break;
            case IMAGETYPE_GIF:
                imagegif($new_image, $image_path);
                break;
            case IMAGETYPE_WEBP:
                imagewebp($new_image, $image_path, $this->jpeg_quality);
                break;
        }
        
        // Free memory
        imagedestroy($new_image);
        imagedestroy($source);
        
        return $file;
    }
    
    /**
     * Set JPEG quality
     */
    public function set_jpeg_quality($quality) {
        return get_option('air_jpeg_quality', $this->jpeg_quality);
    }
    
    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            'Auto Image Resizer Settings',
            'Image Resizer',
            'manage_options',
            'auto-image-resizer',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('air_settings', 'air_max_width');
        register_setting('air_settings', 'air_max_height');
        register_setting('air_settings', 'air_jpeg_quality');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Auto Image Resizer Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('air_settings'); ?>
                <?php do_settings_sections('air_settings'); ?>
                
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Maximum Width (px)</th>
                        <td>
                            <input type="number" name="air_max_width" value="<?php echo esc_attr(get_option('air_max_width', $this->max_width)); ?>" />
                            <p class="description">Maximum width for uploaded images (default: 1920px)</p>
                        </td>
                    </tr>
                    
                    <tr valign="top">
                        <th scope="row">Maximum Height (px)</th>
                        <td>
                            <input type="number" name="air_max_height" value="<?php echo esc_attr(get_option('air_max_height', $this->max_height)); ?>" />
                            <p class="description">Maximum height for uploaded images (default: 1080px)</p>
                        </td>
                    </tr>
                    
                    <tr valign="top">
                        <th scope="row">JPEG Quality</th>
                        <td>
                            <input type="number" name="air_jpeg_quality" min="1" max="100" value="<?php echo esc_attr(get_option('air_jpeg_quality', $this->jpeg_quality)); ?>" />
                            <p class="description">JPEG compression quality (1-100, default: 85)</p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2>About This Plugin</h2>
            <p>This lightweight plugin automatically resizes images when they are uploaded to WordPress.</p>
            <ul>
                <li>✅ Supports JPEG, PNG, GIF, and WebP formats</li>
                <li>✅ Maintains aspect ratio</li>
                <li>✅ Preserves PNG transparency</li>
                <li>✅ Fast and efficient</li>
                <li>✅ No external dependencies</li>
            </ul>
        </div>
        <?php
    }
}

// Initialize the plugin
new WP_Auto_Image_Resizer();
