public class ROT13Cipher {
    
    // ROT13 cipher - special case of Caesar cipher with shift of 13
    public static String encode(String text) {
        StringBuilder result = new StringBuilder();
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                result.append((char) ((c - base + 13) % 26 + base));
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // ROT13 is its own inverse - encoding twice returns original text
    public static String decode(String text) {
        return encode(text);
    }
}