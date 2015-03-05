package co.redseal.gremlinnode.function;

/**
 * Implement a versatile interface that negates the Predicate/BiPredicate result.
 */
class NegateGlobFunction extends IdentityGlobFunction {

    public NegateGlobFunction(final GlobFunction that) {
        super(that);
    }

    @Override
    public String toString() {
        return "-(" + that.toString() + ")";
    }

    // Predicate.test
    @Override
    public boolean test(final Object a) {
        return ! that.test(a);
    }

    // BiPredicate.test
    @Override
    public boolean test(final Object a, final Object b) {
        return ! that.test(a, b);
    }

}
