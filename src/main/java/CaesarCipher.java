public class CaesarCipher {
    
    // Encrypt text using Caesar cipher with given shift
    public static String encrypt(String text, int shift) {
        StringBuilder result = new StringBuilder();
        shift = shift % 26; // Handle shifts > 26
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                result.append((char) ((c - base + shift) % 26 + base));
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // Decrypt text using Caesar cipher with given shift
    public static String decrypt(String text, int shift) {
        return encrypt(text, -shift); // Decrypt by shifting backwards
    }
}