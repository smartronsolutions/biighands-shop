const callbacksMap = new Map();

// Yes sometimes I think JS is magic...
const DynamicSnippetObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const cb = callbacksMap.get(entry.target);
        if (entry.isIntersecting && cb) {
            cb(entry);
            cleanUpObserver(entry.target);
        }
    });
}, {
    root: null,
    rootMargin: '200px 0px',
    threshold: 0.01,
});

export function observeDynamicSnippet(el, callback) {
    if (el && callback) {
        callbacksMap.set(el, callback);
        DynamicSnippetObserver.observe(el);
    }
}

export function unobserveDynamicSnippet(el) {
    cleanUpObserver(el);
}

// This function will never be called from the outside
export function cleanUpObserver(el) {
    if (el) {
        DynamicSnippetObserver.unobserve(el);
        callbacksMap.delete(el);
    }
}
