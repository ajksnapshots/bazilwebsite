function nt(t, e) {
    t.indexOf(e) === -1 && t.push(e)
}
var U = (t,e,r)=>Math.min(Math.max(r, t), e);
var d = {
    duration: .3,
    delay: 0,
    endDelay: 0,
    repeat: 0,
    easing: "ease"
};
var S = t=>typeof t == "number";
var b = t=>Array.isArray(t) && !S(t[0]);
var yt = (t,e,r)=>{
    let i = e - t;
    return ((r - t) % i + i) % i + t
}
;
function xt(t, e) {
    return b(t) ? t[yt(0, t.length, e)] : t
}
var H = (t,e,r)=>-r * t + r * e + t;
var _ = ()=>{}
  , g = t=>t;
var I = (t,e,r)=>e - t === 0 ? 1 : (r - t) / (e - t);
function st(t, e) {
    let r = t[t.length - 1];
    for (let i = 1; i <= e; i++) {
        let s = I(0, e, i);
        t.push(H(r, 1, s))
    }
}
function vt(t) {
    let e = [0];
    return st(e, t - 1),
    e
}
function at(t, e=vt(t.length), r=g) {
    let i = t.length
      , s = i - e.length;
    return s > 0 && st(e, s),
    o=>{
        let a = 0;
        for (; a < i - 2 && !(o < e[a + 1]); a++)
            ;
        let n = U(0, 1, I(e[a], e[a + 1], o));
        return n = xt(r, a)(n),
        H(t[a], t[a + 1], n)
    }
}
var q = t=>Array.isArray(t) && S(t[0]);
var V = t=>typeof t == "object" && Boolean(t.createAnimation);
var v = t=>typeof t == "function";
var ft = t=>typeof t == "string";
var w = {
    ms: t=>t * 1e3,
    s: t=>t / 1e3
};
var At = (t,e,r)=>(((1 - 3 * r + 3 * e) * t + (3 * r - 6 * e)) * t + 3 * e) * t
  , jt = 1e-7
  , Bt = 12;
function Ut(t, e, r, i, s) {
    let o, a, n = 0;
    do
        a = e + (r - e) / 2,
        o = At(a, i, s) - t,
        o > 0 ? r = a : e = a;
    while (Math.abs(o) > jt && ++n < Bt);
    return a
}
function P(t, e, r, i) {
    if (t === e && r === i)
        return g;
    let s = o=>Ut(o, 0, 1, t, r);
    return o=>o === 0 || o === 1 ? o : At(s(o), e, i)
}
var ct = (t,e="end")=>r=>{
    r = e === "end" ? Math.min(r, .999) : Math.max(r, .001);
    let i = r * t
      , s = e === "end" ? Math.floor(i) : Math.ceil(i);
    return U(0, 1, s / t)
}
;
var St = {
    ease: P(.25, .1, .25, 1),
    "ease-in": P(.42, 0, 1, 1),
    "ease-in-out": P(.42, 0, .58, 1),
    "ease-out": P(0, 0, .58, 1)
}
  , _t = /\((.*?)\)/;
function N(t) {
    if (v(t))
        return t;
    if (q(t))
        return P(...t);
    if (St[t])
        return St[t];
    if (t.startsWith("steps")) {
        let e = _t.exec(t);
        if (e) {
            let r = e[1].split(",");
            return ct(parseFloat(r[0]), r[1].trim())
        }
    }
    return g
}
var C = class {
    constructor(e, r=[0, 1], {easing: i, duration: s=d.duration, delay: o=d.delay, endDelay: a=d.endDelay, repeat: n=d.repeat, offset: f, direction: c="normal"}={}) {
        if (this.startTime = null,
        this.rate = 1,
        this.t = 0,
        this.cancelTimestamp = null,
        this.easing = g,
        this.duration = 0,
        this.totalDuration = 0,
        this.repeat = 0,
        this.playState = "idle",
        this.finished = new Promise((h,m)=>{
            this.resolve = h,
            this.reject = m
        }
        ),
        i = i || d.easing,
        V(i)) {
            let h = i.createAnimation(r);
            i = h.easing,
            r = h.keyframes || r,
            s = h.duration || s
        }
        this.repeat = n,
        this.easing = b(i) ? g : N(i),
        this.updateDuration(s);
        let p = at(r, f, b(i) ? i.map(N) : g);
        this.tick = h=>{
            var m;
            o = o;
            let y = 0;
            this.pauseTime !== void 0 ? y = this.pauseTime : y = (h - this.startTime) * this.rate,
            this.t = y,
            y /= 1e3,
            y = Math.max(y - o, 0),
            this.playState === "finished" && this.pauseTime === void 0 && (y = this.totalDuration);
            let x = y / this.duration
              , z = Math.floor(x)
              , E = x % 1;
            !E && x >= 1 && (E = 1),
            E === 1 && z--;
            let X = z % 2;
            (c === "reverse" || c === "alternate" && X || c === "alternate-reverse" && !X) && (E = 1 - E);
            let j = y >= this.totalDuration ? 1 : Math.min(E, 1)
              , M = p(this.easing(j));
            e(M),
            this.pauseTime === void 0 && (this.playState === "finished" || y >= this.totalDuration + a) ? (this.playState = "finished",
            (m = this.resolve) === null || m === void 0 || m.call(this, M)) : this.playState !== "idle" && (this.frameRequestId = requestAnimationFrame(this.tick))
        }
        ,
        this.play()
    }
    play() {
        let e = performance.now();
        this.playState = "running",
        this.pauseTime !== void 0 ? this.startTime = e - this.pauseTime : this.startTime || (this.startTime = e),
        this.cancelTimestamp = this.startTime,
        this.pauseTime = void 0,
        this.frameRequestId = requestAnimationFrame(this.tick)
    }
    pause() {
        this.playState = "paused",
        this.pauseTime = this.t
    }
    finish() {
        this.playState = "finished",
        this.tick(0)
    }
    stop() {
        var e;
        this.playState = "idle",
        this.frameRequestId !== void 0 && cancelAnimationFrame(this.frameRequestId),
        (e = this.reject) === null || e === void 0 || e.call(this, !1)
    }
    cancel() {
        this.stop(),
        this.tick(this.cancelTimestamp)
    }
    reverse() {
        this.rate *= -1
    }
    commitStyles() {}
    updateDuration(e) {
        this.duration = e,
        this.totalDuration = e * (this.repeat + 1)
    }
    get currentTime() {
        return this.t
    }
    set currentTime(e) {
        this.pauseTime !== void 0 || this.rate === 0 ? this.pauseTime = e : this.startTime = performance.now() - e / this.rate
    }
    get playbackRate() {
        return this.rate
    }
    set playbackRate(e) {
        this.rate = e
    }
}
;
var mt = function() {};
var L = class {
    setAnimation(e) {
        this.animation = e,
        e == null || e.finished.then(()=>this.clearAnimation()).catch(()=>{}
        )
    }
    clearAnimation() {
        this.animation = this.generator = void 0
    }
}
;
var pt = new WeakMap;
function J(t) {
    return pt.has(t) || pt.set(t, {
        transforms: [],
        values: new Map
    }),
    pt.get(t)
}
function bt(t, e) {
    return t.has(e) || t.set(e, new L),
    t.get(e)
}
var qt = ["", "X", "Y", "Z"]
  , Lt = ["translate", "scale", "rotate", "skew"]
  , $ = {
    x: "translateX",
    y: "translateY",
    z: "translateZ"
}
  , Tt = {
    syntax: "<angle>",
    initialValue: "0deg",
    toDefaultUnit: t=>t + "deg"
}
  , $t = {
    translate: {
        syntax: "<length-percentage>",
        initialValue: "0px",
        toDefaultUnit: t=>t + "px"
    },
    rotate: Tt,
    scale: {
        syntax: "<number>",
        initialValue: 1,
        toDefaultUnit: g
    },
    skew: Tt
}
  , F = new Map
  , tt = t=>`--motion-${t}`
  , Q = ["x", "y", "z"];
Lt.forEach(t=>{
    qt.forEach(e=>{
        Q.push(t + e),
        F.set(tt(t + e), $t[t])
    }
    )
}
);
var kt = (t,e)=>Q.indexOf(t) - Q.indexOf(e)
  , Kt = new Set(Q)
  , et = t=>Kt.has(t)
  , Et = (t,e)=>{
    $[e] && (e = $[e]);
    let {transforms: r} = J(t);
    nt(r, e),
    t.style.transform = Gt(r)
}
  , Gt = t=>t.sort(kt).reduce(Wt, "").trim()
  , Wt = (t,e)=>`${t} ${e}(var(${tt(e)}))`;
var k = t=>t.startsWith("--")
  , Ot = new Set;
function wt(t) {
    if (!Ot.has(t)) {
        Ot.add(t);
        try {
            let {syntax: e, initialValue: r} = F.has(t) ? F.get(t) : {};
            CSS.registerProperty({
                name: t,
                inherits: !1,
                syntax: e,
                initialValue: r
            })
        } catch {}
    }
}
var lt = (t,e)=>document.createElement("div").animate(t, e)
  , Ft = {
    cssRegisterProperty: ()=>typeof CSS != "undefined" && Object.hasOwnProperty.call(CSS, "registerProperty"),
    waapi: ()=>Object.hasOwnProperty.call(Element.prototype, "animate"),
    partialKeyframes: ()=>{
        try {
            lt({
                opacity: [1]
            })
        } catch {
            return !1
        }
        return !0
    }
    ,
    finished: ()=>Boolean(lt({
        opacity: [0, 1]
    }, {
        duration: .001
    }).finished),
    linearEasing: ()=>{
        try {
            lt({
                opacity: 0
            }, {
                easing: "linear(0, 1)"
            })
        } catch {
            return !1
        }
        return !0
    }
}
  , ut = {}
  , D = {};
for (let t in Ft)
    D[t] = ()=>(ut[t] === void 0 && (ut[t] = Ft[t]()),
    ut[t]);
var Xt = .015
  , Yt = (t,e)=>{
    let r = ""
      , i = Math.round(e / Xt);
    for (let s = 0; s < i; s++)
        r += t(I(0, i - 1, s)) + ", ";
    return r.substring(0, r.length - 2)
}
  , dt = (t,e)=>v(t) ? D.linearEasing() ? `linear(${Yt(t, e)})` : d.easing : q(t) ? Zt(t) : t
  , Zt = ([t,e,r,i])=>`cubic-bezier(${t}, ${e}, ${r}, ${i})`;
function Dt(t, e) {
    for (let r = 0; r < t.length; r++)
        t[r] === null && (t[r] = r ? t[r - 1] : e());
    return t
}
var Rt = t=>Array.isArray(t) ? t : [t];
function K(t) {
    return $[t] && (t = $[t]),
    et(t) ? tt(t) : t
}
var G = {
    get: (t,e)=>{
        e = K(e);
        let r = k(e) ? t.style.getPropertyValue(e) : getComputedStyle(t)[e];
        if (!r && r !== 0) {
            let i = F.get(e);
            i && (r = i.initialValue)
        }
        return r
    }
    ,
    set: (t,e,r)=>{
        e = K(e),
        k(e) ? t.style.setProperty(e, r) : t.style[e] = r
    }
};
function rt(t, e=!0) {
    if (!(!t || t.playState === "finished"))
        try {
            t.stop ? t.stop() : (e && t.commitStyles(),
            t.cancel())
        } catch {}
}
function It(t, e) {
    var r;
    let i = (e == null ? void 0 : e.toDefaultUnit) || g
      , s = t[t.length - 1];
    if (ft(s)) {
        let o = ((r = s.match(/(-?[\d.]+)([a-z%]*)/)) === null || r === void 0 ? void 0 : r[2]) || "";
        o && (i = a=>a + o)
    }
    return i
}
function Ht() {
    return window.__MOTION_DEV_TOOLS_RECORD
}
function Pt(t, e, r, i={}, s) {
    let o = Ht(), a = i.record !== !1 && o, n, {duration: f=d.duration, delay: c=d.delay, endDelay: p=d.endDelay, repeat: h=d.repeat, easing: m=d.easing, persist: y=!1, direction: x, offset: z, allowWebkitAcceleration: E=!1} = i, X = J(t), j = et(e), M = D.waapi();
    j && Et(t, e);
    let A = K(e)
      , Y = bt(X.values, A)
      , O = F.get(A);
    return rt(Y.animation, !(V(m) && Y.generator) && i.record !== !1),
    ()=>{
        let Z = ()=>{
            var l, B;
            return (B = (l = G.get(t, A)) !== null && l !== void 0 ? l : O == null ? void 0 : O.initialValue) !== null && B !== void 0 ? B : 0
        }
          , u = Dt(Rt(r), Z)
          , gt = It(u, O);
        if (V(m)) {
            let l = m.createAnimation(u, e !== "opacity", Z, A, Y);
            m = l.easing,
            u = l.keyframes || u,
            f = l.duration || f
        }
        if (k(A) && (D.cssRegisterProperty() ? wt(A) : M = !1),
        j && !D.linearEasing() && (v(m) || b(m) && m.some(v)) && (M = !1),
        M) {
            O && (u = u.map(R=>S(R) ? O.toDefaultUnit(R) : R)),
            u.length === 1 && (!D.partialKeyframes() || a) && u.unshift(Z());
            let l = {
                delay: w.ms(c),
                duration: w.ms(f),
                endDelay: w.ms(p),
                easing: b(m) ? void 0 : dt(m, f),
                direction: x,
                iterations: h + 1,
                fill: "both"
            };
            n = t.animate({
                [A]: u,
                offset: z,
                easing: b(m) ? m.map(R=>dt(R, f)) : void 0
            }, l),
            n.finished || (n.finished = new Promise((R,zt)=>{
                n.onfinish = R,
                n.oncancel = zt
            }
            ));
            let B = u[u.length - 1];
            n.finished.then(()=>{
                y || (G.set(t, A, B),
                n.cancel())
            }
            ).catch(_),
            E || (n.playbackRate = 1.000001)
        } else if (s && j)
            u = u.map(l=>typeof l == "string" ? parseFloat(l) : l),
            u.length === 1 && u.unshift(parseFloat(Z())),
            n = new s(l=>{
                G.set(t, A, gt ? gt(l) : l)
            }
            ,u,Object.assign(Object.assign({}, i), {
                duration: f,
                easing: m
            }));
        else {
            let l = u[u.length - 1];
            G.set(t, A, O && S(l) ? O.toDefaultUnit(l) : l)
        }
        return a && o(t, e, u, {
            duration: f,
            delay: c,
            easing: m,
            repeat: h,
            offset: z
        }, "motion-one"),
        Y.setAnimation(n),
        n
    }
}
var Ct = (t,e)=>t[e] ? Object.assign(Object.assign({}, t), t[e]) : Object.assign({}, t);
function Mt(t, e) {
    var r;
    return typeof t == "string" ? e ? ((r = e[t]) !== null && r !== void 0 || (e[t] = document.querySelectorAll(t)),
    t = e[t]) : t = document.querySelectorAll(t) : t instanceof Element && (t = [t]),
    Array.from(t || [])
}
var Jt = t=>t()
  , W = (t,e,r=d.duration)=>new Proxy({
    animations: t.map(Jt).filter(Boolean),
    duration: r,
    options: e
},te)
  , Qt = t=>t.animations[0]
  , te = {
    get: (t,e)=>{
        let r = Qt(t);
        switch (e) {
        case "duration":
            return t.duration;
        case "currentTime":
            return w.s((r == null ? void 0 : r[e]) || 0);
        case "playbackRate":
        case "playState":
            return r == null ? void 0 : r[e];
        case "finished":
            return t.finished || (t.finished = Promise.all(t.animations.map(ee)).catch(_)),
            t.finished;
        case "stop":
            return ()=>{
                t.animations.forEach(i=>rt(i))
            }
            ;
        case "forEachNative":
            return i=>{
                t.animations.forEach(s=>i(s, t))
            }
            ;
        default:
            return typeof (r == null ? void 0 : r[e]) == "undefined" ? void 0 : ()=>t.animations.forEach(i=>i[e]())
        }
    }
    ,
    set: (t,e,r)=>{
        switch (e) {
        case "currentTime":
            r = w.ms(r);
        case "currentTime":
        case "playbackRate":
            for (let i = 0; i < t.animations.length; i++)
                t.animations[i][e] = r;
            return !0
        }
        return !1
    }
}
  , ee = t=>t.finished;
function it(t=.1, {start: e=0, from: r=0, easing: i}={}) {
    return (s,o)=>{
        let a = S(r) ? r : re(r, o)
          , n = Math.abs(a - s)
          , f = t * n;
        if (i) {
            let c = o * t;
            f = N(i)(f / c) * c
        }
        return e + f
    }
}
function re(t, e) {
    if (t === "first")
        return 0;
    {
        let r = e - 1;
        return t === "last" ? r : r / 2
    }
}
function Vt(t, e, r) {
    return v(t) ? t(e, r) : t
}
function Nt(t) {
    return function(r, i, s={}) {
        r = Mt(r);
        let o = r.length;
        mt(Boolean(o), "No valid element provided."),
        mt(Boolean(i), "No keyframes defined.");
        let a = [];
        for (let n = 0; n < o; n++) {
            let f = r[n];
            for (let c in i) {
                let p = Ct(s, c);
                p.delay = Vt(p.delay, n, o);
                let h = Pt(f, c, i[c], p, t);
                a.push(h)
            }
        }
        return W(a, s, s.duration)
    }
}
var ht = Nt(C);
function ie(t, e={}) {
    return W([()=>{
        let r = new C(t,[0, 1],e);
        return r.finished.catch(()=>{}
        ),
        r
    }
    ], e, e.duration)
}
function ot(t, e, r) {
    return (v(t) ? ie : ht)(t, e, r)
}
var T = ({initialStyles: t, keyframes: e})=>{
    let r = (o,a={})=>{
        let {target: n, insertAfter: f, display: c=""} = a;
        Array.isArray(o) || (o = [o]);
        for (let p of o)
            p.style.display = c,
            Object.assign(p.style, t),
            n && f !== void 0 ? f ? n.insertBefore(p, f.nextSibling) : n.prepend(p) : n && n.appendChild(p)
    }
    ;
    return {
        prepareIn: r,
        animateIn: async(o,a={})=>{
            let {prepared: n, stagger: f, display: c, ...p} = a;
            n || r(o, a);
            let {finished: h} = ot(o, e, {
                delay: f ? it(f) : void 0,
                ...p
            });
            return await h
        }
        ,
        animateOut: async(o,a={})=>{
            let {remove: n, stagger: f, target: c, insertAfter: p, display: h="none", ...m} = a;
            if (Array.isArray(o) || (o = [o]),
            o = o.filter(x=>document.body.contains(x)),
            !o.length)
                return;
            let {finished: y} = ot(o, e, {
                ...m,
                delay: f ? it(f) : void 0,
                direction: "reverse"
            });
            await y;
            for (let x of o)
                c && p !== void 0 ? p ? c.insertBefore(x, p.nextSibling) : c.prepend(x) : c && c.appendChild(x),
                n ? x.remove() : x.style.display = h
        }
    }
}
;
var wi = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"]
  , Fi = {
    fade: T({
        keyframes: {
            opacity: [0, 1]
        },
        initialStyles: {
            opacity: "0"
        }
    }),
    "slide-up": T({
        keyframes: {
            y: [100, 0],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "translateY(100px)",
            opacity: "0"
        }
    }),
    "slide-down": T({
        keyframes: {
            y: [-100, 0],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "translateY(-100px)",
            opacity: "0"
        }
    }),
    "slide-right": T({
        keyframes: {
            x: [-100, 0],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "translateX(-100px)",
            opacity: "0"
        }
    }),
    "slide-left": T({
        keyframes: {
            x: [100, 0],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "translateX(100px)",
            opacity: "0"
        }
    }),
    grow: T({
        keyframes: {
            scale: [0, 1],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "scale(0)",
            opacity: "0"
        }
    }),
    shrink: T({
        keyframes: {
            scale: [1.25, 1],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "scale(1.25)",
            opacity: "0"
        }
    }),
    spin: T({
        keyframes: {
            rotate: [900, 0],
            opacity: [0, 1]
        },
        initialStyles: {
            transform: "rotate(900deg)",
            opacity: "0"
        }
    })
};
export {Fi as animations, wi as easings};
