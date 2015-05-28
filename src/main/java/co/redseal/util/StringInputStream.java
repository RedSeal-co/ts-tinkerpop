package co.redseal.util;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import static java.nio.charset.StandardCharsets.UTF_8;

public class StringInputStream {

  /**
   * Create an InputStream that reads from a String.
   * This is awkward to do from Javascript, so we provide this utility function.
   */
  static public InputStream from(final String source) {
    return new ByteArrayInputStream(source.getBytes(UTF_8));
  }
}
