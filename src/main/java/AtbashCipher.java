public class AtbashCipher {
    
    // Atbash cipher - substitutes each letter with its mirror in the alphabet
    // A->Z, B->Y, C->X, etc.
    public static String encode(String text) {
        StringBuilder result = new StringBuilder();
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                if (Character.isUpperCase(c)) {
                    result.append((char) ('Z' - (c - 'A')));
                } else {
                    result.append((char) ('z' - (c - 'a')));
                }
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // Atbash is its own inverse - encoding twice returns original text
    public static String decode(String text) {
        return encode(text);
    }
}