public class RailFenceCipher {
    
    // Encrypt text using Rail Fence cipher with given number of rails
    public static String encrypt(String text, int rails) {
        if (rails <= 1) return text;
        
        StringBuilder[] fence = new StringBuilder[rails];
        for (int i = 0; i < rails; i++) {
            fence[i] = new StringBuilder();
        }
        
        int rail = 0;
        boolean down = true;
        
        // Place characters in zigzag pattern
        for (char c : text.toCharArray()) {
            fence[rail].append(c);
            
            if (down) {
                rail++;
                if (rail == rails - 1) down = false;
            } else {
                rail--;
                if (rail == 0) down = true;
            }
        }
        
        // Concatenate all rails
        StringBuilder result = new StringBuilder();
        for (StringBuilder sb : fence) {
            result.append(sb);
        }
        return result.toString();
    }
    
    // Decrypt text using Rail Fence cipher with given number of rails
    public static String decrypt(String text, int rails) {
        if (rails <= 1) return text;
        
        // Create fence pattern to determine positions
        boolean[][] fence = new boolean[rails][text.length()];
        int rail = 0;
        boolean down = true;
        
        // Mark positions in zigzag pattern
        for (int i = 0; i < text.length(); i++) {
            fence[rail][i] = true;
            
            if (down) {
                rail++;
                if (rail == rails - 1) down = false;
            } else {
                rail--;
                if (rail == 0) down = true;
            }
        }
        
        // Fill the fence with characters from encrypted text
        int index = 0;
        char[][] result = new char[rails][text.length()];
        for (int i = 0; i < rails; i++) {
            for (int j = 0; j < text.length(); j++) {
                if (fence[i][j] && index < text.length()) {
                    result[i][j] = text.charAt(index++);
                }
            }
        }
        
        // Read characters in zigzag pattern
        StringBuilder decrypted = new StringBuilder();
        rail = 0;
        down = true;
        for (int i = 0; i < text.length(); i++) {
            decrypted.append(result[rail][i]);
            
            if (down) {
                rail++;
                if (rail == rails - 1) down = false;
            } else {
                rail--;
                if (rail == 0) down = true;
            }
        }
        
        return decrypted.toString();
    }
}