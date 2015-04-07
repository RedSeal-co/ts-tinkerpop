package co.redseal.gremlinnode.function;

import org.apache.tinkerpop.gremlin.util.function.TriConsumer;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;
import java.util.function.BinaryOperator;
import java.util.function.BiPredicate;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;

/**
 * Declare a versatile interface that combines many of the java.util.function interfaces.
 */
public interface GlobFunction
    extends Function, UnaryOperator, BiFunction, BinaryOperator, Supplier, Consumer, BiConsumer, TriConsumer
    , Predicate, BiPredicate {

    // Function.andThen, BiFunction.andThen
    GlobFunction andThen(Function after);
    GlobFunction andThen(Consumer after);
    GlobFunction andThen(BiConsumer after);
    GlobFunction andThen(GlobFunction after);

    // Predicate.negate, BiPredicate.negate
    GlobFunction negate();
}
