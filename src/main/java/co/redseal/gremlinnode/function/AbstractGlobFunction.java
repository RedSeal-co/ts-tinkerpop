package co.redseal.gremlinnode.function;

import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Implement those parts of the GlobFunction interface which are common to all implementations.
 */
abstract class AbstractGlobFunction implements GlobFunction {

    // Force the subclass to create a unique string representation.
    public abstract String toString();

    // GlobFunction.andThen
    @Override
    public GlobFunction andThen(GlobFunction then) {
        return new AndThenGlobFunction(this, then);
    }

    // Function.andThen, BiFunction.andThen
    @Override
    public GlobFunction andThen(Function then) {
        return new AndThenGlobFunction(this, then);
    }

    // Consumer.andThen
    @Override
    public GlobFunction andThen(Consumer then) {
        return new AndThenGlobFunction(this, then);
    }

    // BiConsumer.andThen
    @Override
    public GlobFunction andThen(BiConsumer then) {
        return new AndThenGlobFunction(this, then);
    }

    // Predicate.negate, BiPredicate.negate
    @Override
    public GlobFunction negate() {
        return new NegateGlobFunction(this);
    }
}
