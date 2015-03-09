package co.redseal.gremlinnode.function;

import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Implementation of GlobFunction which implements the andThen composition API.
 */
class AndThenGlobFunction extends IdentityGlobFunction {

    private final BiConsumer biconsumerThen;
    private final Consumer consumerThen;
    private final Function functionThen;

    public AndThenGlobFunction(final GlobFunction that, final BiConsumer then) {
        super(that);
        this.biconsumerThen = then;
        this.consumerThen = null;
        this.functionThen = null;
    }

    public AndThenGlobFunction(final GlobFunction that, final Consumer then) {
        super(that);
        this.biconsumerThen = null;
        this.consumerThen = then;
        this.functionThen = null;
    }

    public AndThenGlobFunction(final GlobFunction that, final Function then) {
        super(that);
        this.biconsumerThen = null;
        this.consumerThen = null;
        this.functionThen = then;
    }

    public AndThenGlobFunction(final GlobFunction that, final GlobFunction then) {
        super(that);
        this.biconsumerThen = then;
        this.consumerThen = then;
        this.functionThen = then;
    }

    public String toString() {
        // Use something that looks like the "composition" operation.
        final String then
            = biconsumerThen != null ? biconsumerThen.toString()
            : consumerThen != null ? consumerThen.toString()
            : functionThen.toString();
        return that.toString() + " then " + then;
    }

    // BiConsumer.accept
    @Override
    public void accept(final Object a, final Object b) {
        that.accept(a, b);
        biconsumerThen.accept(a, b);
    }

    // Consumer.accept
    @Override
    public void accept(final Object a) {
        that.accept(a);
        consumerThen.accept(a);
    }

    // Function.apply, UnaryOperator.apply
    @Override
    public Object apply(final Object a) {
        return functionThen.apply(that.apply(a));
    }

    // BiFunction.apply, BinaryOperator.apply
    @Override
    public Object apply(final Object a, final Object b) {
        return functionThen.apply(that.apply(a, b));
    }
}
