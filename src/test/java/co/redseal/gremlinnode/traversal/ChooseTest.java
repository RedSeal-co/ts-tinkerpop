package co.redseal.gremlinnode.traversal;

import co.redseal.gremlinnode.function.GroovyLambda;
import com.tinkerpop.gremlin.process.T;
import com.tinkerpop.gremlin.process.Traversal;
import com.tinkerpop.gremlin.process.graph.traversal.__;
import com.tinkerpop.gremlin.process.util.MapHelper;
import com.tinkerpop.gremlin.structure.Graph;
import com.tinkerpop.gremlin.structure.Vertex;
import com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory;
import org.junit.Before;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;
import javax.script.ScriptException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * Tests that demonstrate "choose" in ways that mirror the tests in test-traversal-wrapper.js.
 */
public class ChooseTest {

    private Graph graph;

    @Before
    public void initGraph() {
        graph = TinkerFactory.createClassic();
    }

    /**
     * This test has a trivial predicate, i.e. one that always returns false.  On the false branch, it injects "bar",
     * so that the overall traversal will see all vertices, plus the string "bar".
     */
    @Test
    public void trivialChoosePredicateWorks() {
        final Traversal<Vertex, String> traversal =
            graph.V().choose(v -> false,
                             __.inject("foo"),
                             __.inject("bar"));

        Map<String, Long> counts = new HashMap<>();
        int counter = 0;
        while (traversal.hasNext()) {
            Object o = traversal.next();
            if (o instanceof Vertex) {
                Vertex v = (Vertex) o;
                o = v.property("name").value();
            }
            MapHelper.incr(counts, (String) o, 1l);
            counter++;
        }
        assertFalse(traversal.hasNext());
        assertEquals(8, counter);
        assertEquals(8, counts.size());
        assertEquals(Long.valueOf(1), counts.get("foo"));  // inject happens anyway
        assertEquals(Long.valueOf(1), counts.get("bar"));  // only gets injected once
        assertEquals(Long.valueOf(1), counts.get("ripple"));
        assertEquals(Long.valueOf(1), counts.get("vadas"));
        assertEquals(Long.valueOf(1), counts.get("josh"));
        assertEquals(Long.valueOf(1), counts.get("lop"));
        assertEquals(Long.valueOf(1), counts.get("marko"));
        assertEquals(Long.valueOf(1), counts.get("peter"));
    }

    /**
     * Based on documentation example (1).
     * http://www.tinkerpop.com/docs/3.0.0-SNAPSHOT/#choose-step
     */
    @Test
    public void simpleChoosePredicateWorks() {
        final Traversal<Vertex, String> traversal =
            graph.V()
            .choose(v -> v.<String>value("name").length() == 5,
                   __.out(),
                   __.in())
            .values("name");

        Map<String, Long> counts = new HashMap<>();
        int counter = 0;
        while (traversal.hasNext()) {
            MapHelper.incr(counts, traversal.next(), 1l);
            counter++;
        }
        assertFalse(traversal.hasNext());
        assertEquals(9, counter);
        assertEquals(5, counts.size());
        assertEquals(Long.valueOf(1), counts.get("vadas"));
        assertEquals(Long.valueOf(3), counts.get("josh"));
        assertEquals(Long.valueOf(2), counts.get("lop"));
        assertEquals(Long.valueOf(2), counts.get("marko"));
        assertEquals(Long.valueOf(1), counts.get("peter"));
    }

    /**
     * Based on documentation example (2), but with M7 syntax.
     * http://www.tinkerpop.com/docs/3.0.0-SNAPSHOT/#choose-step
     */
    @Test
    public void simpleChooseFunctionWorks() {
        final Traversal<Vertex, String> traversal =
            graph.V()
            .has("age")
            .choose(v -> v.<String>value("name").length())
            .option(5, __.in())
            .option(4, __.out())
            .option(3, __.both())
            .values("name");

        Map<String, Long> counts = new HashMap<>();
        int counter = 0;
        while (traversal.hasNext()) {
            MapHelper.incr(counts, traversal.next(), 1l);
            counter++;
        }
        assertFalse(traversal.hasNext());
        assertEquals(3, counter);
        assertEquals(3, counts.size());
        assertEquals(Long.valueOf(1), counts.get("marko"));
        assertEquals(Long.valueOf(1), counts.get("lop"));
        assertEquals(Long.valueOf(1), counts.get("ripple"));
    }

    /**
     * Based on #simpleChooseFunctionWorks, but with a Groovy function to more closely mirror what we would do from
     * JavaScript.
     */
    @Test
    public void groovyChooseFunctionWorks() {
        GroovyLambda lambda;
        try {
            lambda = new GroovyLambda("{ vertex -> vertex.value('name').length() }");
        }
        catch (ScriptException exc) {
            assertTrue(exc.toString(), false);
            return;
        }

        final Traversal<Vertex, String> traversal =
            graph.V()
            .has("age")
            .choose(lambda)
            .option(5, __.in())
            .option(4, __.out())
            .option(3, __.both())
            .values("name");

        Map<String, Long> counts = new HashMap<>();
        int counter = 0;
        while (traversal.hasNext()) {
            MapHelper.incr(counts, traversal.next(), 1l);
            counter++;
        }
        assertFalse(traversal.hasNext());
        assertEquals(3, counter);
        assertEquals(3, counts.size());
        assertEquals(Long.valueOf(1), counts.get("marko"));
        assertEquals(Long.valueOf(1), counts.get("lop"));
        assertEquals(Long.valueOf(1), counts.get("ripple"));
    }
}
