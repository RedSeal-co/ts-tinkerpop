package co.redseal.gremlinnode.function;

import com.tinkerpop.gremlin.process.computer.util.ScriptEngineCache;
import groovy.lang.Closure;
import javax.script.ScriptEngine;
import javax.script.ScriptException;

/**
 * Create a versatile lambda from a Groovy closure.
 *
 * Based on code written by Marko A. Rodriguez (http://markorodriguez.com)
 */
public class GroovyLambda extends AbstractGlobFunction {

    private final String groovy;
    private final ScriptEngine engine;
    private final Closure closure;

    private final static String GROOVY_SCRIPT_ENGINE_NAME = "Groovy";

    public static ScriptEngine getDefaultEngine() {
        return ScriptEngineCache.get(GROOVY_SCRIPT_ENGINE_NAME);
    }

    public GroovyLambda(final String groovy) throws ScriptException {
        this(groovy, getDefaultEngine());
    }

    public GroovyLambda(final String groovy, final ScriptEngine engine) throws ScriptException {
        this.groovy = groovy;
        this.engine = engine;
        this.closure = (Closure) this.engine.eval(groovy);
    }

    public String toString() {
        return "GroovyLambda(" + groovy + ")";
    }

    // Function.apply, UnaryOperator.apply
    @Override
    public Object apply(final Object a) {
        return this.closure.call(a);
    }

    // BiFunction.apply, BinaryOperator.apply
    @Override
    public Object apply(final Object a, final Object b) {
        return this.closure.call(a, b);
    }

    // Supplier.get
    @Override
    public Object get() {
        return this.closure.call();
    }

    // Consumer.accept
    @Override
    public void accept(final Object a) {
        this.closure.call(a);
    }

    // BiConsumer.accept
    @Override
    public void accept(final Object a, final Object b) {
        this.closure.call(a, b);
    }

    // TriConsumer.accept
    @Override
    public void accept(final Object a, final Object b, final Object c) {
        this.closure.call(a, b, c);
    }

    // Predicate.test
    @Override
    public boolean test(final Object a) {
        return (boolean) this.closure.call(a);
    }

    // BiPredicate.test
    @Override
    public boolean test(final Object a, final Object b) {
        return (boolean) this.closure.call(a, b);
    }
}
