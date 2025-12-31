public class CipherDemo {
    
    public static void main(String[] args) {
        String plaintext = "Hello World";
        System.out.println("Original text: " + plaintext);
        System.out.println("=" + "=".repeat(50));
        
        // Caesar Cipher Demo
        System.out.println("\n1. CAESAR CIPHER (shift = 3):");
        String caesarEncrypted = CaesarCipher.encrypt(plaintext, 3);
        String caesarDecrypted = CaesarCipher.decrypt(caesarEncrypted, 3);
        System.out.println("Encrypted: " + caesarEncrypted);
        System.out.println("Decrypted: " + caesarDecrypted);
        
        // ROT13 Cipher Demo
        System.out.println("\n2. ROT13 CIPHER:");
        String rot13Encoded = ROT13Cipher.encode(plaintext);
        String rot13Decoded = ROT13Cipher.decode(rot13Encoded);
        System.out.println("Encoded: " + rot13Encoded);
        System.out.println("Decoded: " + rot13Decoded);
        
        // Atbash Cipher Demo
        System.out.println("\n3. ATBASH CIPHER:");
        String atbashEncoded = AtbashCipher.encode(plaintext);
        String atbashDecoded = AtbashCipher.decode(atbashEncoded);
        System.out.println("Encoded: " + atbashEncoded);
        System.out.println("Decoded: " + atbashDecoded);
        
        // Vigenère Cipher Demo
        System.out.println("\n4. VIGENÈRE CIPHER (key = 'KEY'):");
        String vigenereEncrypted = VigenereCipher.encrypt(plaintext, "KEY");
        String vigenereDecrypted = VigenereCipher.decrypt(vigenereEncrypted, "KEY");
        System.out.println("Encrypted: " + vigenereEncrypted);
        System.out.println("Decrypted: " + vigenereDecrypted);
        
        // Rail Fence Cipher Demo
        System.out.println("\n5. RAIL FENCE CIPHER (rails = 3):");
        String railFenceEncrypted = RailFenceCipher.encrypt(plaintext, 3);
        String railFenceDecrypted = RailFenceCipher.decrypt(railFenceEncrypted, 3);
        System.out.println("Encrypted: " + railFenceEncrypted);
        System.out.println("Decrypted: " + railFenceDecrypted);
        
        System.out.println("\n" + "=".repeat(52));
        System.out.println("All cipher algorithms implemented successfully!");
    }
}