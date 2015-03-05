package co.redseal.gremlinnode.function;

/**
 * Identity implementation of GlobFunction which simply delegates to another.
 */
abstract class IdentityGlobFunction extends AbstractGlobFunction {

    protected final GlobFunction that;

    public IdentityGlobFunction(final GlobFunction that) {
        this.that = that;
    }

    // Function.apply, UnaryOperator.apply
    @Override
    public Object apply(final Object a) {
        return that.apply(a);
    }

    // BiFunction.apply, BinaryOperator.apply
    @Override
    public Object apply(final Object a, final Object b) {
        return that.apply(a, b);
    }

    // Supplier.get
    @Override
    public Object get() {
        return that.get();
    }

    // Consumer.accept
    @Override
    public void accept(final Object a) {
        that.accept(a);
    }

    // BiConsumer.accept
    @Override
    public void accept(final Object a, final Object b) {
        that.accept(a, b);
    }

    // TriConsumer.accept
    @Override
    public void accept(final Object a, final Object b, final Object c) {
        that.accept(a, b, c);
    }

    // Predicate.test
    @Override
    public boolean test(final Object a) {
        return that.test(a);
    }

    // BiPredicate.test
    @Override
    public boolean test(final Object a, final Object b) {
        return that.test(a, b);
    }
}
