var Bd = Object.defineProperty;
var Hd = (e, t, r) => t in e ? Bd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var V = (e, t, r) => Hd(e, typeof t != "symbol" ? t + "" : t, r);
import gt, { app as Rr, BrowserWindow as yc, ipcMain as Pe, shell as qd } from "electron";
import { createRequire as vc } from "node:module";
import K from "path";
import Le from "fs";
import { fileURLToPath as Gd } from "node:url";
import Ke from "node:path";
import Wd from "constants";
import Wr from "stream";
import Xn from "util";
import wc from "assert";
import Vr from "child_process";
import Jn from "events";
import zr from "crypto";
import _c from "tty";
import St from "os";
import lr from "url";
import Vd from "string_decoder";
import Sc from "zlib";
import Ac from "http";
import zd from "https";
const Yd = vc(import.meta.url), Xd = Yd("better-sqlite3");
console.log("App Name : ", Rr.getName());
const Ko = K.join("./database", "lawfirm.db");
console.log("Databse Path : ", Ko);
Le.mkdirSync(K.dirname(Ko), { recursive: !0 });
const ye = new Xd(Ko);
ye.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    address TEXT,
    note TEXT,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL,
    court TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    tags TEXT,
    updatedAt TEXT NOT NULL
    );
    
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    dueDate TEXT, -- ISO date (nullable if no due date)
    time TEXT, -- optional time
    clientId TEXT NOT NULL,
    caseId TEXT NOT NULL,
    note TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL DEFAULT 'Open',
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
    updatedAt TEXT NOT NULL
  );
`);
const Jd = (e) => ye.prepare("SELECT 1 FROM clients WHERE phone = ? OR email = ?").get(e.phone, e.email) ? { success: !1, error: "Client with same phone or email already exists." } : ye.prepare(`
    INSERT INTO clients 
    (id, name, phone, email, address, updatedAt, note) 
    VALUES (@id, @name, @phone, @email, @address, @updatedAt, @note)
  `).run({
  id: e.id,
  name: e.name,
  phone: e.phone,
  email: e.email,
  address: e.address ?? "",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  note: e.note ?? ""
}).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0 }, Kd = () => ye.prepare("SELECT * FROM clients").all(), Qd = (e, t, r) => {
  if (!["name", "email", "phone", "address", "notes"].includes(t)) return !1;
  const i = ye.prepare(`UPDATE clients SET ${t} = ? WHERE id = ?`).run(r, e);
  return console.log("inside Client repo"), i.changes === 0 ? { success: !1, error: "Update Failed: No idea what happend." } : { success: !0 };
}, Zd = (e) => ye.prepare("DELETE FROM clients WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, eh = (e) => ye.prepare("SELECT 1 FROM cases WHERE id = ?").get(e.id) ? { success: !1, error: "Case with same CaseID already exists." } : (ye.prepare(`
    INSERT INTO cases
    (id, title, description, status, clientId, court, createdAt, tags, updatedAt)
    VALUES (@id, @title, @description, @status, @clientId, @court, @createdAt, @tags, @updatedAt)
  `).run({
  ...e,
  tags: JSON.stringify(e.tags ?? []),
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
}), { success: !0 }), th = () => ye.prepare("SELECT * FROM cases").all(), rh = (e, t, r) => {
  if (!ye.prepare("SELECT 1 FROM cases WHERE id = ?").get(e)) return { success: !1, error: "Case not found" };
  const i = t === "tags", o = (/* @__PURE__ */ new Date()).toISOString();
  if (!ye.prepare(`
    UPDATE cases
    SET ${t} = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    i ? JSON.stringify(r) : r,
    o,
    e
  ).changes) return { success: !1, error: "Update failed: No idea what happend." };
  const l = ye.prepare("SELECT * FROM cases WHERE id = ?").get(e);
  return { success: !0, updatedCase: ((c) => ({
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : []
  }))(l) };
}, nh = (e) => ye.prepare("DELETE FROM cases WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, ih = (e) => ye.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, dueDate, time, clientId, caseId, status, priority, note, updatedAt)
    VALUES (@id, @title, @dueDate, @time, @clientId, @caseId, @status, @priority, @note, @updatedAt)
  `).run({
  ...e,
  note: e.note ?? "",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
}).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0 }, oh = () => ye.prepare("SELECT * FROM tasks").all(), sh = (e) => ye.prepare("DELETE FROM tasks WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, ah = (e) => ye.prepare(`
    UPDATE tasks
    SET 
      title = @title,
      dueDate = @dueDate,
      time = @time,
      clientId = @clientId,
      caseId = @caseId,
      note = @note,
      status = @status,
      priority = @priority,
      updatedAt = @updatedAt
    WHERE id = @id
  `).run({
  ...e,
  note: e.note ?? "",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
}).changes === 0 ? { success: !1, error: "Update failed: No such task found (or i have no idea what happend)." } : { success: !0 };
var be = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function lh(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Xe = {}, kt = {}, $e = {};
$e.fromCallback = function(e) {
  return Object.defineProperty(function(...t) {
    if (typeof t[t.length - 1] == "function") e.apply(this, t);
    else
      return new Promise((r, n) => {
        t.push((i, o) => i != null ? n(i) : r(o)), e.apply(this, t);
      });
  }, "name", { value: e.name });
};
$e.fromPromise = function(e) {
  return Object.defineProperty(function(...t) {
    const r = t[t.length - 1];
    if (typeof r != "function") return e.apply(this, t);
    t.pop(), e.apply(this, t).then((n) => r(null, n), r);
  }, "name", { value: e.name });
};
var ct = Wd, ch = process.cwd, Nn = null, uh = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return Nn || (Nn = ch.call(process)), Nn;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var Ys = process.chdir;
  process.chdir = function(e) {
    Nn = null, Ys.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, Ys);
}
var fh = dh;
function dh(e) {
  ct.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || r(e), e.chown = o(e.chown), e.fchown = o(e.fchown), e.lchown = o(e.lchown), e.chmod = n(e.chmod), e.fchmod = n(e.fchmod), e.lchmod = n(e.lchmod), e.chownSync = s(e.chownSync), e.fchownSync = s(e.fchownSync), e.lchownSync = s(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = a(e.stat), e.fstat = a(e.fstat), e.lstat = a(e.lstat), e.statSync = l(e.statSync), e.fstatSync = l(e.fstatSync), e.lstatSync = l(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(c, u, h) {
    h && process.nextTick(h);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(c, u, h, m) {
    m && process.nextTick(m);
  }, e.lchownSync = function() {
  }), uh === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(c) {
    function u(h, m, w) {
      var y = Date.now(), _ = 0;
      c(h, m, function A(T) {
        if (T && (T.code === "EACCES" || T.code === "EPERM" || T.code === "EBUSY") && Date.now() - y < 6e4) {
          setTimeout(function() {
            e.stat(m, function(P, L) {
              P && P.code === "ENOENT" ? c(h, m, A) : w(T);
            });
          }, _), _ < 100 && (_ += 10);
          return;
        }
        w && w(T);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(c) {
    function u(h, m, w, y, _, A) {
      var T;
      if (A && typeof A == "function") {
        var P = 0;
        T = function(L, B, H) {
          if (L && L.code === "EAGAIN" && P < 10)
            return P++, c.call(e, h, m, w, y, _, T);
          A.apply(this, arguments);
        };
      }
      return c.call(e, h, m, w, y, _, T);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(c) {
    return function(u, h, m, w, y) {
      for (var _ = 0; ; )
        try {
          return c.call(e, u, h, m, w, y);
        } catch (A) {
          if (A.code === "EAGAIN" && _ < 10) {
            _++;
            continue;
          }
          throw A;
        }
    };
  }(e.readSync);
  function t(c) {
    c.lchmod = function(u, h, m) {
      c.open(
        u,
        ct.O_WRONLY | ct.O_SYMLINK,
        h,
        function(w, y) {
          if (w) {
            m && m(w);
            return;
          }
          c.fchmod(y, h, function(_) {
            c.close(y, function(A) {
              m && m(_ || A);
            });
          });
        }
      );
    }, c.lchmodSync = function(u, h) {
      var m = c.openSync(u, ct.O_WRONLY | ct.O_SYMLINK, h), w = !0, y;
      try {
        y = c.fchmodSync(m, h), w = !1;
      } finally {
        if (w)
          try {
            c.closeSync(m);
          } catch {
          }
        else
          c.closeSync(m);
      }
      return y;
    };
  }
  function r(c) {
    ct.hasOwnProperty("O_SYMLINK") && c.futimes ? (c.lutimes = function(u, h, m, w) {
      c.open(u, ct.O_SYMLINK, function(y, _) {
        if (y) {
          w && w(y);
          return;
        }
        c.futimes(_, h, m, function(A) {
          c.close(_, function(T) {
            w && w(A || T);
          });
        });
      });
    }, c.lutimesSync = function(u, h, m) {
      var w = c.openSync(u, ct.O_SYMLINK), y, _ = !0;
      try {
        y = c.futimesSync(w, h, m), _ = !1;
      } finally {
        if (_)
          try {
            c.closeSync(w);
          } catch {
          }
        else
          c.closeSync(w);
      }
      return y;
    }) : c.futimes && (c.lutimes = function(u, h, m, w) {
      w && process.nextTick(w);
    }, c.lutimesSync = function() {
    });
  }
  function n(c) {
    return c && function(u, h, m) {
      return c.call(e, u, h, function(w) {
        f(w) && (w = null), m && m.apply(this, arguments);
      });
    };
  }
  function i(c) {
    return c && function(u, h) {
      try {
        return c.call(e, u, h);
      } catch (m) {
        if (!f(m)) throw m;
      }
    };
  }
  function o(c) {
    return c && function(u, h, m, w) {
      return c.call(e, u, h, m, function(y) {
        f(y) && (y = null), w && w.apply(this, arguments);
      });
    };
  }
  function s(c) {
    return c && function(u, h, m) {
      try {
        return c.call(e, u, h, m);
      } catch (w) {
        if (!f(w)) throw w;
      }
    };
  }
  function a(c) {
    return c && function(u, h, m) {
      typeof h == "function" && (m = h, h = null);
      function w(y, _) {
        _ && (_.uid < 0 && (_.uid += 4294967296), _.gid < 0 && (_.gid += 4294967296)), m && m.apply(this, arguments);
      }
      return h ? c.call(e, u, h, w) : c.call(e, u, w);
    };
  }
  function l(c) {
    return c && function(u, h) {
      var m = h ? c.call(e, u, h) : c.call(e, u);
      return m && (m.uid < 0 && (m.uid += 4294967296), m.gid < 0 && (m.gid += 4294967296)), m;
    };
  }
  function f(c) {
    if (!c || c.code === "ENOSYS")
      return !0;
    var u = !process.getuid || process.getuid() !== 0;
    return !!(u && (c.code === "EINVAL" || c.code === "EPERM"));
  }
}
var Xs = Wr.Stream, hh = ph;
function ph(e) {
  return {
    ReadStream: t,
    WriteStream: r
  };
  function t(n, i) {
    if (!(this instanceof t)) return new t(n, i);
    Xs.call(this);
    var o = this;
    this.path = n, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var s = Object.keys(i), a = 0, l = s.length; a < l; a++) {
      var f = s[a];
      this[f] = i[f];
    }
    if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.end === void 0)
        this.end = 1 / 0;
      else if (typeof this.end != "number")
        throw TypeError("end must be a Number");
      if (this.start > this.end)
        throw new Error("start must be <= end");
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        o._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(c, u) {
      if (c) {
        o.emit("error", c), o.readable = !1;
        return;
      }
      o.fd = u, o.emit("open", u), o._read();
    });
  }
  function r(n, i) {
    if (!(this instanceof r)) return new r(n, i);
    Xs.call(this), this.path = n, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var o = Object.keys(i), s = 0, a = o.length; s < a; s++) {
      var l = o[s];
      this[l] = i[l];
    }
    if (this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.start < 0)
        throw new Error("start must be >= zero");
      this.pos = this.start;
    }
    this.busy = !1, this._queue = [], this.fd === null && (this._open = e.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
  }
}
var mh = Eh, gh = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function Eh(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: gh(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(r) {
    Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
  }), t;
}
var ie = Le, yh = fh, vh = hh, wh = mh, mn = Xn, Ee, Un;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (Ee = Symbol.for("graceful-fs.queue"), Un = Symbol.for("graceful-fs.previous")) : (Ee = "___graceful-fs.queue", Un = "___graceful-fs.previous");
function _h() {
}
function Tc(e, t) {
  Object.defineProperty(e, Ee, {
    get: function() {
      return t;
    }
  });
}
var Lt = _h;
mn.debuglog ? Lt = mn.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Lt = function() {
  var e = mn.format.apply(mn, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!ie[Ee]) {
  var Sh = be[Ee] || [];
  Tc(ie, Sh), ie.close = function(e) {
    function t(r, n) {
      return e.call(ie, r, function(i) {
        i || Js(), typeof n == "function" && n.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, Un, {
      value: e
    }), t;
  }(ie.close), ie.closeSync = function(e) {
    function t(r) {
      e.apply(ie, arguments), Js();
    }
    return Object.defineProperty(t, Un, {
      value: e
    }), t;
  }(ie.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    Lt(ie[Ee]), wc.equal(ie[Ee].length, 0);
  });
}
be[Ee] || Tc(be, ie[Ee]);
var Re = Qo(wh(ie));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !ie.__patched && (Re = Qo(ie), ie.__patched = !0);
function Qo(e) {
  yh(e), e.gracefulify = Qo, e.createReadStream = B, e.createWriteStream = H;
  var t = e.readFile;
  e.readFile = r;
  function r(E, z, q) {
    return typeof z == "function" && (q = z, z = null), M(E, z, q);
    function M(Q, R, O, N) {
      return t(Q, R, function(C) {
        C && (C.code === "EMFILE" || C.code === "ENFILE") ? qt([M, [Q, R, O], C, N || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var n = e.writeFile;
  e.writeFile = i;
  function i(E, z, q, M) {
    return typeof q == "function" && (M = q, q = null), Q(E, z, q, M);
    function Q(R, O, N, C, D) {
      return n(R, O, N, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Q, [R, O, N, C], I, D || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var o = e.appendFile;
  o && (e.appendFile = s);
  function s(E, z, q, M) {
    return typeof q == "function" && (M = q, q = null), Q(E, z, q, M);
    function Q(R, O, N, C, D) {
      return o(R, O, N, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Q, [R, O, N, C], I, D || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var a = e.copyFile;
  a && (e.copyFile = l);
  function l(E, z, q, M) {
    return typeof q == "function" && (M = q, q = 0), Q(E, z, q, M);
    function Q(R, O, N, C, D) {
      return a(R, O, N, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Q, [R, O, N, C], I, D || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var f = e.readdir;
  e.readdir = u;
  var c = /^v[0-5]\./;
  function u(E, z, q) {
    typeof z == "function" && (q = z, z = null);
    var M = c.test(process.version) ? function(O, N, C, D) {
      return f(O, Q(
        O,
        N,
        C,
        D
      ));
    } : function(O, N, C, D) {
      return f(O, N, Q(
        O,
        N,
        C,
        D
      ));
    };
    return M(E, z, q);
    function Q(R, O, N, C) {
      return function(D, I) {
        D && (D.code === "EMFILE" || D.code === "ENFILE") ? qt([
          M,
          [R, O, N],
          D,
          C || Date.now(),
          Date.now()
        ]) : (I && I.sort && I.sort(), typeof N == "function" && N.call(this, D, I));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var h = vh(e);
    A = h.ReadStream, P = h.WriteStream;
  }
  var m = e.ReadStream;
  m && (A.prototype = Object.create(m.prototype), A.prototype.open = T);
  var w = e.WriteStream;
  w && (P.prototype = Object.create(w.prototype), P.prototype.open = L), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return A;
    },
    set: function(E) {
      A = E;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return P;
    },
    set: function(E) {
      P = E;
    },
    enumerable: !0,
    configurable: !0
  });
  var y = A;
  Object.defineProperty(e, "FileReadStream", {
    get: function() {
      return y;
    },
    set: function(E) {
      y = E;
    },
    enumerable: !0,
    configurable: !0
  });
  var _ = P;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return _;
    },
    set: function(E) {
      _ = E;
    },
    enumerable: !0,
    configurable: !0
  });
  function A(E, z) {
    return this instanceof A ? (m.apply(this, arguments), this) : A.apply(Object.create(A.prototype), arguments);
  }
  function T() {
    var E = this;
    ae(E.path, E.flags, E.mode, function(z, q) {
      z ? (E.autoClose && E.destroy(), E.emit("error", z)) : (E.fd = q, E.emit("open", q), E.read());
    });
  }
  function P(E, z) {
    return this instanceof P ? (w.apply(this, arguments), this) : P.apply(Object.create(P.prototype), arguments);
  }
  function L() {
    var E = this;
    ae(E.path, E.flags, E.mode, function(z, q) {
      z ? (E.destroy(), E.emit("error", z)) : (E.fd = q, E.emit("open", q));
    });
  }
  function B(E, z) {
    return new e.ReadStream(E, z);
  }
  function H(E, z) {
    return new e.WriteStream(E, z);
  }
  var j = e.open;
  e.open = ae;
  function ae(E, z, q, M) {
    return typeof q == "function" && (M = q, q = null), Q(E, z, q, M);
    function Q(R, O, N, C, D) {
      return j(R, O, N, function(I, k) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Q, [R, O, N, C], I, D || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  return e;
}
function qt(e) {
  Lt("ENQUEUE", e[0].name, e[1]), ie[Ee].push(e), Zo();
}
var gn;
function Js() {
  for (var e = Date.now(), t = 0; t < ie[Ee].length; ++t)
    ie[Ee][t].length > 2 && (ie[Ee][t][3] = e, ie[Ee][t][4] = e);
  Zo();
}
function Zo() {
  if (clearTimeout(gn), gn = void 0, ie[Ee].length !== 0) {
    var e = ie[Ee].shift(), t = e[0], r = e[1], n = e[2], i = e[3], o = e[4];
    if (i === void 0)
      Lt("RETRY", t.name, r), t.apply(null, r);
    else if (Date.now() - i >= 6e4) {
      Lt("TIMEOUT", t.name, r);
      var s = r.pop();
      typeof s == "function" && s.call(null, n);
    } else {
      var a = Date.now() - o, l = Math.max(o - i, 1), f = Math.min(l * 1.2, 100);
      a >= f ? (Lt("RETRY", t.name, r), t.apply(null, r.concat([i]))) : ie[Ee].push(e);
    }
    gn === void 0 && (gn = setTimeout(Zo, 0));
  }
}
(function(e) {
  const t = $e.fromCallback, r = Re, n = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((i) => typeof r[i] == "function");
  Object.assign(e, r), n.forEach((i) => {
    e[i] = t(r[i]);
  }), e.exists = function(i, o) {
    return typeof o == "function" ? r.exists(i, o) : new Promise((s) => r.exists(i, s));
  }, e.read = function(i, o, s, a, l, f) {
    return typeof f == "function" ? r.read(i, o, s, a, l, f) : new Promise((c, u) => {
      r.read(i, o, s, a, l, (h, m, w) => {
        if (h) return u(h);
        c({ bytesRead: m, buffer: w });
      });
    });
  }, e.write = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? r.write(i, o, ...s) : new Promise((a, l) => {
      r.write(i, o, ...s, (f, c, u) => {
        if (f) return l(f);
        a({ bytesWritten: c, buffer: u });
      });
    });
  }, typeof r.writev == "function" && (e.writev = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? r.writev(i, o, ...s) : new Promise((a, l) => {
      r.writev(i, o, ...s, (f, c, u) => {
        if (f) return l(f);
        a({ bytesWritten: c, buffers: u });
      });
    });
  }), typeof r.realpath.native == "function" ? e.realpath.native = t(r.realpath.native) : process.emitWarning(
    "fs.realpath.native is not a function. Is fs being monkey-patched?",
    "Warning",
    "fs-extra-WARN0003"
  );
})(kt);
var es = {}, bc = {};
const Ah = K;
bc.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(Ah.parse(t).root, ""))) {
    const n = new Error(`Path contains invalid characters: ${t}`);
    throw n.code = "EINVAL", n;
  }
};
const Cc = kt, { checkPath: Oc } = bc, $c = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
es.makeDir = async (e, t) => (Oc(e), Cc.mkdir(e, {
  mode: $c(t),
  recursive: !0
}));
es.makeDirSync = (e, t) => (Oc(e), Cc.mkdirSync(e, {
  mode: $c(t),
  recursive: !0
}));
const Th = $e.fromPromise, { makeDir: bh, makeDirSync: $i } = es, Ri = Th(bh);
var Ze = {
  mkdirs: Ri,
  mkdirsSync: $i,
  // alias
  mkdirp: Ri,
  mkdirpSync: $i,
  ensureDir: Ri,
  ensureDirSync: $i
};
const Ch = $e.fromPromise, Rc = kt;
function Oh(e) {
  return Rc.access(e).then(() => !0).catch(() => !1);
}
var Mt = {
  pathExists: Ch(Oh),
  pathExistsSync: Rc.existsSync
};
const rr = Re;
function $h(e, t, r, n) {
  rr.open(e, "r+", (i, o) => {
    if (i) return n(i);
    rr.futimes(o, t, r, (s) => {
      rr.close(o, (a) => {
        n && n(s || a);
      });
    });
  });
}
function Rh(e, t, r) {
  const n = rr.openSync(e, "r+");
  return rr.futimesSync(n, t, r), rr.closeSync(n);
}
var Ic = {
  utimesMillis: $h,
  utimesMillisSync: Rh
};
const ir = kt, he = K, Ih = Xn;
function Nh(e, t, r) {
  const n = r.dereference ? (i) => ir.stat(i, { bigint: !0 }) : (i) => ir.lstat(i, { bigint: !0 });
  return Promise.all([
    n(e),
    n(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, o]) => ({ srcStat: i, destStat: o }));
}
function Ph(e, t, r) {
  let n;
  const i = r.dereference ? (s) => ir.statSync(s, { bigint: !0 }) : (s) => ir.lstatSync(s, { bigint: !0 }), o = i(e);
  try {
    n = i(t);
  } catch (s) {
    if (s.code === "ENOENT") return { srcStat: o, destStat: null };
    throw s;
  }
  return { srcStat: o, destStat: n };
}
function Dh(e, t, r, n, i) {
  Ih.callbackify(Nh)(e, t, n, (o, s) => {
    if (o) return i(o);
    const { srcStat: a, destStat: l } = s;
    if (l) {
      if (Yr(a, l)) {
        const f = he.basename(e), c = he.basename(t);
        return r === "move" && f !== c && f.toLowerCase() === c.toLowerCase() ? i(null, { srcStat: a, destStat: l, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (a.isDirectory() && !l.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!a.isDirectory() && l.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return a.isDirectory() && ts(e, t) ? i(new Error(Kn(e, t, r))) : i(null, { srcStat: a, destStat: l });
  });
}
function Fh(e, t, r, n) {
  const { srcStat: i, destStat: o } = Ph(e, t, n);
  if (o) {
    if (Yr(i, o)) {
      const s = he.basename(e), a = he.basename(t);
      if (r === "move" && s !== a && s.toLowerCase() === a.toLowerCase())
        return { srcStat: i, destStat: o, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !o.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && o.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && ts(e, t))
    throw new Error(Kn(e, t, r));
  return { srcStat: i, destStat: o };
}
function Nc(e, t, r, n, i) {
  const o = he.resolve(he.dirname(e)), s = he.resolve(he.dirname(r));
  if (s === o || s === he.parse(s).root) return i();
  ir.stat(s, { bigint: !0 }, (a, l) => a ? a.code === "ENOENT" ? i() : i(a) : Yr(t, l) ? i(new Error(Kn(e, r, n))) : Nc(e, t, s, n, i));
}
function Pc(e, t, r, n) {
  const i = he.resolve(he.dirname(e)), o = he.resolve(he.dirname(r));
  if (o === i || o === he.parse(o).root) return;
  let s;
  try {
    s = ir.statSync(o, { bigint: !0 });
  } catch (a) {
    if (a.code === "ENOENT") return;
    throw a;
  }
  if (Yr(t, s))
    throw new Error(Kn(e, r, n));
  return Pc(e, t, o, n);
}
function Yr(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function ts(e, t) {
  const r = he.resolve(e).split(he.sep).filter((i) => i), n = he.resolve(t).split(he.sep).filter((i) => i);
  return r.reduce((i, o, s) => i && n[s] === o, !0);
}
function Kn(e, t, r) {
  return `Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`;
}
var cr = {
  checkPaths: Dh,
  checkPathsSync: Fh,
  checkParentPaths: Nc,
  checkParentPathsSync: Pc,
  isSrcSubdir: ts,
  areIdentical: Yr
};
const De = Re, Ir = K, Lh = Ze.mkdirs, xh = Mt.pathExists, Uh = Ic.utimesMillis, Nr = cr;
function kh(e, t, r, n) {
  typeof r == "function" && !n ? (n = r, r = {}) : typeof r == "function" && (r = { filter: r }), n = n || function() {
  }, r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Nr.checkPaths(e, t, "copy", r, (i, o) => {
    if (i) return n(i);
    const { srcStat: s, destStat: a } = o;
    Nr.checkParentPaths(e, s, t, "copy", (l) => l ? n(l) : r.filter ? Dc(Ks, a, e, t, r, n) : Ks(a, e, t, r, n));
  });
}
function Ks(e, t, r, n, i) {
  const o = Ir.dirname(r);
  xh(o, (s, a) => {
    if (s) return i(s);
    if (a) return kn(e, t, r, n, i);
    Lh(o, (l) => l ? i(l) : kn(e, t, r, n, i));
  });
}
function Dc(e, t, r, n, i, o) {
  Promise.resolve(i.filter(r, n)).then((s) => s ? e(t, r, n, i, o) : o(), (s) => o(s));
}
function Mh(e, t, r, n, i) {
  return n.filter ? Dc(kn, e, t, r, n, i) : kn(e, t, r, n, i);
}
function kn(e, t, r, n, i) {
  (n.dereference ? De.stat : De.lstat)(t, (s, a) => s ? i(s) : a.isDirectory() ? Vh(a, e, t, r, n, i) : a.isFile() || a.isCharacterDevice() || a.isBlockDevice() ? jh(a, e, t, r, n, i) : a.isSymbolicLink() ? Xh(e, t, r, n, i) : a.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : a.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function jh(e, t, r, n, i, o) {
  return t ? Bh(e, r, n, i, o) : Fc(e, r, n, i, o);
}
function Bh(e, t, r, n, i) {
  if (n.overwrite)
    De.unlink(r, (o) => o ? i(o) : Fc(e, t, r, n, i));
  else return n.errorOnExist ? i(new Error(`'${r}' already exists`)) : i();
}
function Fc(e, t, r, n, i) {
  De.copyFile(t, r, (o) => o ? i(o) : n.preserveTimestamps ? Hh(e.mode, t, r, i) : Qn(r, e.mode, i));
}
function Hh(e, t, r, n) {
  return qh(e) ? Gh(r, e, (i) => i ? n(i) : Qs(e, t, r, n)) : Qs(e, t, r, n);
}
function qh(e) {
  return (e & 128) === 0;
}
function Gh(e, t, r) {
  return Qn(e, t | 128, r);
}
function Qs(e, t, r, n) {
  Wh(t, r, (i) => i ? n(i) : Qn(r, e, n));
}
function Qn(e, t, r) {
  return De.chmod(e, t, r);
}
function Wh(e, t, r) {
  De.stat(e, (n, i) => n ? r(n) : Uh(t, i.atime, i.mtime, r));
}
function Vh(e, t, r, n, i, o) {
  return t ? Lc(r, n, i, o) : zh(e.mode, r, n, i, o);
}
function zh(e, t, r, n, i) {
  De.mkdir(r, (o) => {
    if (o) return i(o);
    Lc(t, r, n, (s) => s ? i(s) : Qn(r, e, i));
  });
}
function Lc(e, t, r, n) {
  De.readdir(e, (i, o) => i ? n(i) : xc(o, e, t, r, n));
}
function xc(e, t, r, n, i) {
  const o = e.pop();
  return o ? Yh(e, o, t, r, n, i) : i();
}
function Yh(e, t, r, n, i, o) {
  const s = Ir.join(r, t), a = Ir.join(n, t);
  Nr.checkPaths(s, a, "copy", i, (l, f) => {
    if (l) return o(l);
    const { destStat: c } = f;
    Mh(c, s, a, i, (u) => u ? o(u) : xc(e, r, n, i, o));
  });
}
function Xh(e, t, r, n, i) {
  De.readlink(t, (o, s) => {
    if (o) return i(o);
    if (n.dereference && (s = Ir.resolve(process.cwd(), s)), e)
      De.readlink(r, (a, l) => a ? a.code === "EINVAL" || a.code === "UNKNOWN" ? De.symlink(s, r, i) : i(a) : (n.dereference && (l = Ir.resolve(process.cwd(), l)), Nr.isSrcSubdir(s, l) ? i(new Error(`Cannot copy '${s}' to a subdirectory of itself, '${l}'.`)) : e.isDirectory() && Nr.isSrcSubdir(l, s) ? i(new Error(`Cannot overwrite '${l}' with '${s}'.`)) : Jh(s, r, i)));
    else
      return De.symlink(s, r, i);
  });
}
function Jh(e, t, r) {
  De.unlink(t, (n) => n ? r(n) : De.symlink(e, t, r));
}
var Kh = kh;
const Se = Re, Pr = K, Qh = Ze.mkdirsSync, Zh = Ic.utimesMillisSync, Dr = cr;
function ep(e, t, r) {
  typeof r == "function" && (r = { filter: r }), r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: n, destStat: i } = Dr.checkPathsSync(e, t, "copy", r);
  return Dr.checkParentPathsSync(e, n, t, "copy"), tp(i, e, t, r);
}
function tp(e, t, r, n) {
  if (n.filter && !n.filter(t, r)) return;
  const i = Pr.dirname(r);
  return Se.existsSync(i) || Qh(i), Uc(e, t, r, n);
}
function rp(e, t, r, n) {
  if (!(n.filter && !n.filter(t, r)))
    return Uc(e, t, r, n);
}
function Uc(e, t, r, n) {
  const o = (n.dereference ? Se.statSync : Se.lstatSync)(t);
  if (o.isDirectory()) return cp(o, e, t, r, n);
  if (o.isFile() || o.isCharacterDevice() || o.isBlockDevice()) return np(o, e, t, r, n);
  if (o.isSymbolicLink()) return dp(e, t, r, n);
  throw o.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : o.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function np(e, t, r, n, i) {
  return t ? ip(e, r, n, i) : kc(e, r, n, i);
}
function ip(e, t, r, n) {
  if (n.overwrite)
    return Se.unlinkSync(r), kc(e, t, r, n);
  if (n.errorOnExist)
    throw new Error(`'${r}' already exists`);
}
function kc(e, t, r, n) {
  return Se.copyFileSync(t, r), n.preserveTimestamps && op(e.mode, t, r), rs(r, e.mode);
}
function op(e, t, r) {
  return sp(e) && ap(r, e), lp(t, r);
}
function sp(e) {
  return (e & 128) === 0;
}
function ap(e, t) {
  return rs(e, t | 128);
}
function rs(e, t) {
  return Se.chmodSync(e, t);
}
function lp(e, t) {
  const r = Se.statSync(e);
  return Zh(t, r.atime, r.mtime);
}
function cp(e, t, r, n, i) {
  return t ? Mc(r, n, i) : up(e.mode, r, n, i);
}
function up(e, t, r, n) {
  return Se.mkdirSync(r), Mc(t, r, n), rs(r, e);
}
function Mc(e, t, r) {
  Se.readdirSync(e).forEach((n) => fp(n, e, t, r));
}
function fp(e, t, r, n) {
  const i = Pr.join(t, e), o = Pr.join(r, e), { destStat: s } = Dr.checkPathsSync(i, o, "copy", n);
  return rp(s, i, o, n);
}
function dp(e, t, r, n) {
  let i = Se.readlinkSync(t);
  if (n.dereference && (i = Pr.resolve(process.cwd(), i)), e) {
    let o;
    try {
      o = Se.readlinkSync(r);
    } catch (s) {
      if (s.code === "EINVAL" || s.code === "UNKNOWN") return Se.symlinkSync(i, r);
      throw s;
    }
    if (n.dereference && (o = Pr.resolve(process.cwd(), o)), Dr.isSrcSubdir(i, o))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${o}'.`);
    if (Se.statSync(r).isDirectory() && Dr.isSrcSubdir(o, i))
      throw new Error(`Cannot overwrite '${o}' with '${i}'.`);
    return hp(i, r);
  } else
    return Se.symlinkSync(i, r);
}
function hp(e, t) {
  return Se.unlinkSync(t), Se.symlinkSync(e, t);
}
var pp = ep;
const mp = $e.fromCallback;
var ns = {
  copy: mp(Kh),
  copySync: pp
};
const Zs = Re, jc = K, ee = wc, Fr = process.platform === "win32";
function Bc(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((r) => {
    e[r] = e[r] || Zs[r], r = r + "Sync", e[r] = e[r] || Zs[r];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function is(e, t, r) {
  let n = 0;
  typeof t == "function" && (r = t, t = {}), ee(e, "rimraf: missing path"), ee.strictEqual(typeof e, "string", "rimraf: path should be a string"), ee.strictEqual(typeof r, "function", "rimraf: callback function required"), ee(t, "rimraf: invalid options argument provided"), ee.strictEqual(typeof t, "object", "rimraf: options should be object"), Bc(t), ea(e, t, function i(o) {
    if (o) {
      if ((o.code === "EBUSY" || o.code === "ENOTEMPTY" || o.code === "EPERM") && n < t.maxBusyTries) {
        n++;
        const s = n * 100;
        return setTimeout(() => ea(e, t, i), s);
      }
      o.code === "ENOENT" && (o = null);
    }
    r(o);
  });
}
function ea(e, t, r) {
  ee(e), ee(t), ee(typeof r == "function"), t.lstat(e, (n, i) => {
    if (n && n.code === "ENOENT")
      return r(null);
    if (n && n.code === "EPERM" && Fr)
      return ta(e, t, n, r);
    if (i && i.isDirectory())
      return Pn(e, t, n, r);
    t.unlink(e, (o) => {
      if (o) {
        if (o.code === "ENOENT")
          return r(null);
        if (o.code === "EPERM")
          return Fr ? ta(e, t, o, r) : Pn(e, t, o, r);
        if (o.code === "EISDIR")
          return Pn(e, t, o, r);
      }
      return r(o);
    });
  });
}
function ta(e, t, r, n) {
  ee(e), ee(t), ee(typeof n == "function"), t.chmod(e, 438, (i) => {
    i ? n(i.code === "ENOENT" ? null : r) : t.stat(e, (o, s) => {
      o ? n(o.code === "ENOENT" ? null : r) : s.isDirectory() ? Pn(e, t, r, n) : t.unlink(e, n);
    });
  });
}
function ra(e, t, r) {
  let n;
  ee(e), ee(t);
  try {
    t.chmodSync(e, 438);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw r;
  }
  try {
    n = t.statSync(e);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw r;
  }
  n.isDirectory() ? Dn(e, t, r) : t.unlinkSync(e);
}
function Pn(e, t, r, n) {
  ee(e), ee(t), ee(typeof n == "function"), t.rmdir(e, (i) => {
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? gp(e, t, n) : i && i.code === "ENOTDIR" ? n(r) : n(i);
  });
}
function gp(e, t, r) {
  ee(e), ee(t), ee(typeof r == "function"), t.readdir(e, (n, i) => {
    if (n) return r(n);
    let o = i.length, s;
    if (o === 0) return t.rmdir(e, r);
    i.forEach((a) => {
      is(jc.join(e, a), t, (l) => {
        if (!s) {
          if (l) return r(s = l);
          --o === 0 && t.rmdir(e, r);
        }
      });
    });
  });
}
function Hc(e, t) {
  let r;
  t = t || {}, Bc(t), ee(e, "rimraf: missing path"), ee.strictEqual(typeof e, "string", "rimraf: path should be a string"), ee(t, "rimraf: missing options"), ee.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    r = t.lstatSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    n.code === "EPERM" && Fr && ra(e, t, n);
  }
  try {
    r && r.isDirectory() ? Dn(e, t, null) : t.unlinkSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    if (n.code === "EPERM")
      return Fr ? ra(e, t, n) : Dn(e, t, n);
    if (n.code !== "EISDIR")
      throw n;
    Dn(e, t, n);
  }
}
function Dn(e, t, r) {
  ee(e), ee(t);
  try {
    t.rmdirSync(e);
  } catch (n) {
    if (n.code === "ENOTDIR")
      throw r;
    if (n.code === "ENOTEMPTY" || n.code === "EEXIST" || n.code === "EPERM")
      Ep(e, t);
    else if (n.code !== "ENOENT")
      throw n;
  }
}
function Ep(e, t) {
  if (ee(e), ee(t), t.readdirSync(e).forEach((r) => Hc(jc.join(e, r), t)), Fr) {
    const r = Date.now();
    do
      try {
        return t.rmdirSync(e, t);
      } catch {
      }
    while (Date.now() - r < 500);
  } else
    return t.rmdirSync(e, t);
}
var yp = is;
is.sync = Hc;
const Mn = Re, vp = $e.fromCallback, qc = yp;
function wp(e, t) {
  if (Mn.rm) return Mn.rm(e, { recursive: !0, force: !0 }, t);
  qc(e, t);
}
function _p(e) {
  if (Mn.rmSync) return Mn.rmSync(e, { recursive: !0, force: !0 });
  qc.sync(e);
}
var Zn = {
  remove: vp(wp),
  removeSync: _p
};
const Sp = $e.fromPromise, Gc = kt, Wc = K, Vc = Ze, zc = Zn, na = Sp(async function(t) {
  let r;
  try {
    r = await Gc.readdir(t);
  } catch {
    return Vc.mkdirs(t);
  }
  return Promise.all(r.map((n) => zc.remove(Wc.join(t, n))));
});
function ia(e) {
  let t;
  try {
    t = Gc.readdirSync(e);
  } catch {
    return Vc.mkdirsSync(e);
  }
  t.forEach((r) => {
    r = Wc.join(e, r), zc.removeSync(r);
  });
}
var Ap = {
  emptyDirSync: ia,
  emptydirSync: ia,
  emptyDir: na,
  emptydir: na
};
const Tp = $e.fromCallback, Yc = K, ht = Re, Xc = Ze;
function bp(e, t) {
  function r() {
    ht.writeFile(e, "", (n) => {
      if (n) return t(n);
      t();
    });
  }
  ht.stat(e, (n, i) => {
    if (!n && i.isFile()) return t();
    const o = Yc.dirname(e);
    ht.stat(o, (s, a) => {
      if (s)
        return s.code === "ENOENT" ? Xc.mkdirs(o, (l) => {
          if (l) return t(l);
          r();
        }) : t(s);
      a.isDirectory() ? r() : ht.readdir(o, (l) => {
        if (l) return t(l);
      });
    });
  });
}
function Cp(e) {
  let t;
  try {
    t = ht.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const r = Yc.dirname(e);
  try {
    ht.statSync(r).isDirectory() || ht.readdirSync(r);
  } catch (n) {
    if (n && n.code === "ENOENT") Xc.mkdirsSync(r);
    else throw n;
  }
  ht.writeFileSync(e, "");
}
var Op = {
  createFile: Tp(bp),
  createFileSync: Cp
};
const $p = $e.fromCallback, Jc = K, dt = Re, Kc = Ze, Rp = Mt.pathExists, { areIdentical: Qc } = cr;
function Ip(e, t, r) {
  function n(i, o) {
    dt.link(i, o, (s) => {
      if (s) return r(s);
      r(null);
    });
  }
  dt.lstat(t, (i, o) => {
    dt.lstat(e, (s, a) => {
      if (s)
        return s.message = s.message.replace("lstat", "ensureLink"), r(s);
      if (o && Qc(a, o)) return r(null);
      const l = Jc.dirname(t);
      Rp(l, (f, c) => {
        if (f) return r(f);
        if (c) return n(e, t);
        Kc.mkdirs(l, (u) => {
          if (u) return r(u);
          n(e, t);
        });
      });
    });
  });
}
function Np(e, t) {
  let r;
  try {
    r = dt.lstatSync(t);
  } catch {
  }
  try {
    const o = dt.lstatSync(e);
    if (r && Qc(o, r)) return;
  } catch (o) {
    throw o.message = o.message.replace("lstat", "ensureLink"), o;
  }
  const n = Jc.dirname(t);
  return dt.existsSync(n) || Kc.mkdirsSync(n), dt.linkSync(e, t);
}
var Pp = {
  createLink: $p(Ip),
  createLinkSync: Np
};
const pt = K, br = Re, Dp = Mt.pathExists;
function Fp(e, t, r) {
  if (pt.isAbsolute(e))
    return br.lstat(e, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), r(n)) : r(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const n = pt.dirname(t), i = pt.join(n, e);
    return Dp(i, (o, s) => o ? r(o) : s ? r(null, {
      toCwd: i,
      toDst: e
    }) : br.lstat(e, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), r(a)) : r(null, {
      toCwd: e,
      toDst: pt.relative(n, e)
    })));
  }
}
function Lp(e, t) {
  let r;
  if (pt.isAbsolute(e)) {
    if (r = br.existsSync(e), !r) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const n = pt.dirname(t), i = pt.join(n, e);
    if (r = br.existsSync(i), r)
      return {
        toCwd: i,
        toDst: e
      };
    if (r = br.existsSync(e), !r) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: pt.relative(n, e)
    };
  }
}
var xp = {
  symlinkPaths: Fp,
  symlinkPathsSync: Lp
};
const Zc = Re;
function Up(e, t, r) {
  if (r = typeof t == "function" ? t : r, t = typeof t == "function" ? !1 : t, t) return r(null, t);
  Zc.lstat(e, (n, i) => {
    if (n) return r(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", r(null, t);
  });
}
function kp(e, t) {
  let r;
  if (t) return t;
  try {
    r = Zc.lstatSync(e);
  } catch {
    return "file";
  }
  return r && r.isDirectory() ? "dir" : "file";
}
var Mp = {
  symlinkType: Up,
  symlinkTypeSync: kp
};
const jp = $e.fromCallback, eu = K, qe = kt, tu = Ze, Bp = tu.mkdirs, Hp = tu.mkdirsSync, ru = xp, qp = ru.symlinkPaths, Gp = ru.symlinkPathsSync, nu = Mp, Wp = nu.symlinkType, Vp = nu.symlinkTypeSync, zp = Mt.pathExists, { areIdentical: iu } = cr;
function Yp(e, t, r, n) {
  n = typeof r == "function" ? r : n, r = typeof r == "function" ? !1 : r, qe.lstat(t, (i, o) => {
    !i && o.isSymbolicLink() ? Promise.all([
      qe.stat(e),
      qe.stat(t)
    ]).then(([s, a]) => {
      if (iu(s, a)) return n(null);
      oa(e, t, r, n);
    }) : oa(e, t, r, n);
  });
}
function oa(e, t, r, n) {
  qp(e, t, (i, o) => {
    if (i) return n(i);
    e = o.toDst, Wp(o.toCwd, r, (s, a) => {
      if (s) return n(s);
      const l = eu.dirname(t);
      zp(l, (f, c) => {
        if (f) return n(f);
        if (c) return qe.symlink(e, t, a, n);
        Bp(l, (u) => {
          if (u) return n(u);
          qe.symlink(e, t, a, n);
        });
      });
    });
  });
}
function Xp(e, t, r) {
  let n;
  try {
    n = qe.lstatSync(t);
  } catch {
  }
  if (n && n.isSymbolicLink()) {
    const a = qe.statSync(e), l = qe.statSync(t);
    if (iu(a, l)) return;
  }
  const i = Gp(e, t);
  e = i.toDst, r = Vp(i.toCwd, r);
  const o = eu.dirname(t);
  return qe.existsSync(o) || Hp(o), qe.symlinkSync(e, t, r);
}
var Jp = {
  createSymlink: jp(Yp),
  createSymlinkSync: Xp
};
const { createFile: sa, createFileSync: aa } = Op, { createLink: la, createLinkSync: ca } = Pp, { createSymlink: ua, createSymlinkSync: fa } = Jp;
var Kp = {
  // file
  createFile: sa,
  createFileSync: aa,
  ensureFile: sa,
  ensureFileSync: aa,
  // link
  createLink: la,
  createLinkSync: ca,
  ensureLink: la,
  ensureLinkSync: ca,
  // symlink
  createSymlink: ua,
  createSymlinkSync: fa,
  ensureSymlink: ua,
  ensureSymlinkSync: fa
};
function Qp(e, { EOL: t = `
`, finalEOL: r = !0, replacer: n = null, spaces: i } = {}) {
  const o = r ? t : "";
  return JSON.stringify(e, n, i).replace(/\n/g, t) + o;
}
function Zp(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var os = { stringify: Qp, stripBom: Zp };
let or;
try {
  or = Re;
} catch {
  or = Le;
}
const ei = $e, { stringify: ou, stripBom: su } = os;
async function em(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || or, n = "throws" in t ? t.throws : !0;
  let i = await ei.fromCallback(r.readFile)(e, t);
  i = su(i);
  let o;
  try {
    o = JSON.parse(i, t ? t.reviver : null);
  } catch (s) {
    if (n)
      throw s.message = `${e}: ${s.message}`, s;
    return null;
  }
  return o;
}
const tm = ei.fromPromise(em);
function rm(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || or, n = "throws" in t ? t.throws : !0;
  try {
    let i = r.readFileSync(e, t);
    return i = su(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (n)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function nm(e, t, r = {}) {
  const n = r.fs || or, i = ou(t, r);
  await ei.fromCallback(n.writeFile)(e, i, r);
}
const im = ei.fromPromise(nm);
function om(e, t, r = {}) {
  const n = r.fs || or, i = ou(t, r);
  return n.writeFileSync(e, i, r);
}
const sm = {
  readFile: tm,
  readFileSync: rm,
  writeFile: im,
  writeFileSync: om
};
var am = sm;
const En = am;
var lm = {
  // jsonfile exports
  readJson: En.readFile,
  readJsonSync: En.readFileSync,
  writeJson: En.writeFile,
  writeJsonSync: En.writeFileSync
};
const cm = $e.fromCallback, Cr = Re, au = K, lu = Ze, um = Mt.pathExists;
function fm(e, t, r, n) {
  typeof r == "function" && (n = r, r = "utf8");
  const i = au.dirname(e);
  um(i, (o, s) => {
    if (o) return n(o);
    if (s) return Cr.writeFile(e, t, r, n);
    lu.mkdirs(i, (a) => {
      if (a) return n(a);
      Cr.writeFile(e, t, r, n);
    });
  });
}
function dm(e, ...t) {
  const r = au.dirname(e);
  if (Cr.existsSync(r))
    return Cr.writeFileSync(e, ...t);
  lu.mkdirsSync(r), Cr.writeFileSync(e, ...t);
}
var ss = {
  outputFile: cm(fm),
  outputFileSync: dm
};
const { stringify: hm } = os, { outputFile: pm } = ss;
async function mm(e, t, r = {}) {
  const n = hm(t, r);
  await pm(e, n, r);
}
var gm = mm;
const { stringify: Em } = os, { outputFileSync: ym } = ss;
function vm(e, t, r) {
  const n = Em(t, r);
  ym(e, n, r);
}
var wm = vm;
const _m = $e.fromPromise, Oe = lm;
Oe.outputJson = _m(gm);
Oe.outputJsonSync = wm;
Oe.outputJSON = Oe.outputJson;
Oe.outputJSONSync = Oe.outputJsonSync;
Oe.writeJSON = Oe.writeJson;
Oe.writeJSONSync = Oe.writeJsonSync;
Oe.readJSON = Oe.readJson;
Oe.readJSONSync = Oe.readJsonSync;
var Sm = Oe;
const Am = Re, Do = K, Tm = ns.copy, cu = Zn.remove, bm = Ze.mkdirp, Cm = Mt.pathExists, da = cr;
function Om(e, t, r, n) {
  typeof r == "function" && (n = r, r = {}), r = r || {};
  const i = r.overwrite || r.clobber || !1;
  da.checkPaths(e, t, "move", r, (o, s) => {
    if (o) return n(o);
    const { srcStat: a, isChangingCase: l = !1 } = s;
    da.checkParentPaths(e, a, t, "move", (f) => {
      if (f) return n(f);
      if ($m(t)) return ha(e, t, i, l, n);
      bm(Do.dirname(t), (c) => c ? n(c) : ha(e, t, i, l, n));
    });
  });
}
function $m(e) {
  const t = Do.dirname(e);
  return Do.parse(t).root === t;
}
function ha(e, t, r, n, i) {
  if (n) return Ii(e, t, r, i);
  if (r)
    return cu(t, (o) => o ? i(o) : Ii(e, t, r, i));
  Cm(t, (o, s) => o ? i(o) : s ? i(new Error("dest already exists.")) : Ii(e, t, r, i));
}
function Ii(e, t, r, n) {
  Am.rename(e, t, (i) => i ? i.code !== "EXDEV" ? n(i) : Rm(e, t, r, n) : n());
}
function Rm(e, t, r, n) {
  Tm(e, t, {
    overwrite: r,
    errorOnExist: !0
  }, (o) => o ? n(o) : cu(e, n));
}
var Im = Om;
const uu = Re, Fo = K, Nm = ns.copySync, fu = Zn.removeSync, Pm = Ze.mkdirpSync, pa = cr;
function Dm(e, t, r) {
  r = r || {};
  const n = r.overwrite || r.clobber || !1, { srcStat: i, isChangingCase: o = !1 } = pa.checkPathsSync(e, t, "move", r);
  return pa.checkParentPathsSync(e, i, t, "move"), Fm(t) || Pm(Fo.dirname(t)), Lm(e, t, n, o);
}
function Fm(e) {
  const t = Fo.dirname(e);
  return Fo.parse(t).root === t;
}
function Lm(e, t, r, n) {
  if (n) return Ni(e, t, r);
  if (r)
    return fu(t), Ni(e, t, r);
  if (uu.existsSync(t)) throw new Error("dest already exists.");
  return Ni(e, t, r);
}
function Ni(e, t, r) {
  try {
    uu.renameSync(e, t);
  } catch (n) {
    if (n.code !== "EXDEV") throw n;
    return xm(e, t, r);
  }
}
function xm(e, t, r) {
  return Nm(e, t, {
    overwrite: r,
    errorOnExist: !0
  }), fu(e);
}
var Um = Dm;
const km = $e.fromCallback;
var Mm = {
  move: km(Im),
  moveSync: Um
}, At = {
  // Export promiseified graceful-fs:
  ...kt,
  // Export extra methods:
  ...ns,
  ...Ap,
  ...Kp,
  ...Sm,
  ...Ze,
  ...Mm,
  ...ss,
  ...Mt,
  ...Zn
}, it = {}, Et = {}, pe = {}, yt = {};
Object.defineProperty(yt, "__esModule", { value: !0 });
yt.CancellationError = yt.CancellationToken = void 0;
const jm = Jn;
class Bm extends jm.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(t) {
    this.removeParentCancelHandler(), this._parent = t, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(t) {
    super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, t != null && (this.parent = t);
  }
  cancel() {
    this._cancelled = !0, this.emit("cancel");
  }
  onCancel(t) {
    this.cancelled ? t() : this.once("cancel", t);
  }
  createPromise(t) {
    if (this.cancelled)
      return Promise.reject(new Lo());
    const r = () => {
      if (n != null)
        try {
          this.removeListener("cancel", n), n = null;
        } catch {
        }
    };
    let n = null;
    return new Promise((i, o) => {
      let s = null;
      if (n = () => {
        try {
          s != null && (s(), s = null);
        } finally {
          o(new Lo());
        }
      }, this.cancelled) {
        n();
        return;
      }
      this.onCancel(n), t(i, o, (a) => {
        s = a;
      });
    }).then((i) => (r(), i)).catch((i) => {
      throw r(), i;
    });
  }
  removeParentCancelHandler() {
    const t = this._parent;
    t != null && this.parentCancelHandler != null && (t.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners(), this._parent = null;
    }
  }
}
yt.CancellationToken = Bm;
class Lo extends Error {
  constructor() {
    super("cancelled");
  }
}
yt.CancellationError = Lo;
var ur = {};
Object.defineProperty(ur, "__esModule", { value: !0 });
ur.newError = Hm;
function Hm(e, t) {
  const r = new Error(e);
  return r.code = t, r;
}
var Ce = {}, xo = { exports: {} }, yn = { exports: {} }, Pi, ma;
function qm() {
  if (ma) return Pi;
  ma = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, i = n * 7, o = n * 365.25;
  Pi = function(c, u) {
    u = u || {};
    var h = typeof c;
    if (h === "string" && c.length > 0)
      return s(c);
    if (h === "number" && isFinite(c))
      return u.long ? l(c) : a(c);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(c)
    );
  };
  function s(c) {
    if (c = String(c), !(c.length > 100)) {
      var u = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        c
      );
      if (u) {
        var h = parseFloat(u[1]), m = (u[2] || "ms").toLowerCase();
        switch (m) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return h * o;
          case "weeks":
          case "week":
          case "w":
            return h * i;
          case "days":
          case "day":
          case "d":
            return h * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return h * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return h * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return h * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return h;
          default:
            return;
        }
      }
    }
  }
  function a(c) {
    var u = Math.abs(c);
    return u >= n ? Math.round(c / n) + "d" : u >= r ? Math.round(c / r) + "h" : u >= t ? Math.round(c / t) + "m" : u >= e ? Math.round(c / e) + "s" : c + "ms";
  }
  function l(c) {
    var u = Math.abs(c);
    return u >= n ? f(c, u, n, "day") : u >= r ? f(c, u, r, "hour") : u >= t ? f(c, u, t, "minute") : u >= e ? f(c, u, e, "second") : c + " ms";
  }
  function f(c, u, h, m) {
    var w = u >= h * 1.5;
    return Math.round(c / h) + " " + m + (w ? "s" : "");
  }
  return Pi;
}
var Di, ga;
function du() {
  if (ga) return Di;
  ga = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = f, n.disable = a, n.enable = o, n.enabled = l, n.humanize = qm(), n.destroy = c, Object.keys(t).forEach((u) => {
      n[u] = t[u];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(u) {
      let h = 0;
      for (let m = 0; m < u.length; m++)
        h = (h << 5) - h + u.charCodeAt(m), h |= 0;
      return n.colors[Math.abs(h) % n.colors.length];
    }
    n.selectColor = r;
    function n(u) {
      let h, m = null, w, y;
      function _(...A) {
        if (!_.enabled)
          return;
        const T = _, P = Number(/* @__PURE__ */ new Date()), L = P - (h || P);
        T.diff = L, T.prev = h, T.curr = P, h = P, A[0] = n.coerce(A[0]), typeof A[0] != "string" && A.unshift("%O");
        let B = 0;
        A[0] = A[0].replace(/%([a-zA-Z%])/g, (j, ae) => {
          if (j === "%%")
            return "%";
          B++;
          const E = n.formatters[ae];
          if (typeof E == "function") {
            const z = A[B];
            j = E.call(T, z), A.splice(B, 1), B--;
          }
          return j;
        }), n.formatArgs.call(T, A), (T.log || n.log).apply(T, A);
      }
      return _.namespace = u, _.useColors = n.useColors(), _.color = n.selectColor(u), _.extend = i, _.destroy = n.destroy, Object.defineProperty(_, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (w !== n.namespaces && (w = n.namespaces, y = n.enabled(u)), y),
        set: (A) => {
          m = A;
        }
      }), typeof n.init == "function" && n.init(_), _;
    }
    function i(u, h) {
      const m = n(this.namespace + (typeof h > "u" ? ":" : h) + u);
      return m.log = this.log, m;
    }
    function o(u) {
      n.save(u), n.namespaces = u, n.names = [], n.skips = [];
      const h = (typeof u == "string" ? u : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const m of h)
        m[0] === "-" ? n.skips.push(m.slice(1)) : n.names.push(m);
    }
    function s(u, h) {
      let m = 0, w = 0, y = -1, _ = 0;
      for (; m < u.length; )
        if (w < h.length && (h[w] === u[m] || h[w] === "*"))
          h[w] === "*" ? (y = w, _ = m, w++) : (m++, w++);
        else if (y !== -1)
          w = y + 1, _++, m = _;
        else
          return !1;
      for (; w < h.length && h[w] === "*"; )
        w++;
      return w === h.length;
    }
    function a() {
      const u = [
        ...n.names,
        ...n.skips.map((h) => "-" + h)
      ].join(",");
      return n.enable(""), u;
    }
    function l(u) {
      for (const h of n.skips)
        if (s(u, h))
          return !1;
      for (const h of n.names)
        if (s(u, h))
          return !0;
      return !1;
    }
    function f(u) {
      return u instanceof Error ? u.stack || u.message : u;
    }
    function c() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return Di = e, Di;
}
var Ea;
function Gm() {
  return Ea || (Ea = 1, function(e, t) {
    t.formatArgs = n, t.save = i, t.load = o, t.useColors = r, t.storage = s(), t.destroy = /* @__PURE__ */ (() => {
      let l = !1;
      return () => {
        l || (l = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let l;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (l = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(l[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(l) {
      if (l[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + l[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const f = "color: " + this.color;
      l.splice(1, 0, f, "color: inherit");
      let c = 0, u = 0;
      l[0].replace(/%[a-zA-Z%]/g, (h) => {
        h !== "%%" && (c++, h === "%c" && (u = c));
      }), l.splice(u, 0, f);
    }
    t.log = console.debug || console.log || (() => {
    });
    function i(l) {
      try {
        l ? t.storage.setItem("debug", l) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function o() {
      let l;
      try {
        l = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !l && typeof process < "u" && "env" in process && (l = process.env.DEBUG), l;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = du()(t);
    const { formatters: a } = e.exports;
    a.j = function(l) {
      try {
        return JSON.stringify(l);
      } catch (f) {
        return "[UnexpectedJSONParseError]: " + f.message;
      }
    };
  }(yn, yn.exports)), yn.exports;
}
var vn = { exports: {} }, Fi, ya;
function Wm() {
  return ya || (ya = 1, Fi = (e, t = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = t.indexOf(r + e), i = t.indexOf("--");
    return n !== -1 && (i === -1 || n < i);
  }), Fi;
}
var Li, va;
function Vm() {
  if (va) return Li;
  va = 1;
  const e = St, t = _c, r = Wm(), { env: n } = process;
  let i;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? i = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (i = 1), "FORCE_COLOR" in n && (n.FORCE_COLOR === "true" ? i = 1 : n.FORCE_COLOR === "false" ? i = 0 : i = n.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(n.FORCE_COLOR, 10), 3));
  function o(l) {
    return l === 0 ? !1 : {
      level: l,
      hasBasic: !0,
      has256: l >= 2,
      has16m: l >= 3
    };
  }
  function s(l, f) {
    if (i === 0)
      return 0;
    if (r("color=16m") || r("color=full") || r("color=truecolor"))
      return 3;
    if (r("color=256"))
      return 2;
    if (l && !f && i === void 0)
      return 0;
    const c = i || 0;
    if (n.TERM === "dumb")
      return c;
    if (process.platform === "win32") {
      const u = e.release().split(".");
      return Number(u[0]) >= 10 && Number(u[2]) >= 10586 ? Number(u[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in n)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((u) => u in n) || n.CI_NAME === "codeship" ? 1 : c;
    if ("TEAMCITY_VERSION" in n)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n.TEAMCITY_VERSION) ? 1 : 0;
    if (n.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in n) {
      const u = parseInt((n.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (n.TERM_PROGRAM) {
        case "iTerm.app":
          return u >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(n.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n.TERM) || "COLORTERM" in n ? 1 : c;
  }
  function a(l) {
    const f = s(l, l && l.isTTY);
    return o(f);
  }
  return Li = {
    supportsColor: a,
    stdout: o(s(!0, t.isatty(1))),
    stderr: o(s(!0, t.isatty(2)))
  }, Li;
}
var wa;
function zm() {
  return wa || (wa = 1, function(e, t) {
    const r = _c, n = Xn;
    t.init = c, t.log = a, t.formatArgs = o, t.save = l, t.load = f, t.useColors = i, t.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = Vm();
      h && (h.stderr || h).level >= 2 && (t.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    t.inspectOpts = Object.keys(process.env).filter((h) => /^debug_/i.test(h)).reduce((h, m) => {
      const w = m.substring(6).toLowerCase().replace(/_([a-z])/g, (_, A) => A.toUpperCase());
      let y = process.env[m];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), h[w] = y, h;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function o(h) {
      const { namespace: m, useColors: w } = this;
      if (w) {
        const y = this.color, _ = "\x1B[3" + (y < 8 ? y : "8;5;" + y), A = `  ${_};1m${m} \x1B[0m`;
        h[0] = A + h[0].split(`
`).join(`
` + A), h.push(_ + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        h[0] = s() + m + " " + h[0];
    }
    function s() {
      return t.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function a(...h) {
      return process.stderr.write(n.formatWithOptions(t.inspectOpts, ...h) + `
`);
    }
    function l(h) {
      h ? process.env.DEBUG = h : delete process.env.DEBUG;
    }
    function f() {
      return process.env.DEBUG;
    }
    function c(h) {
      h.inspectOpts = {};
      const m = Object.keys(t.inspectOpts);
      for (let w = 0; w < m.length; w++)
        h.inspectOpts[m[w]] = t.inspectOpts[m[w]];
    }
    e.exports = du()(t);
    const { formatters: u } = e.exports;
    u.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, u.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(vn, vn.exports)), vn.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? xo.exports = Gm() : xo.exports = zm();
var Ym = xo.exports, Xr = {};
Object.defineProperty(Xr, "__esModule", { value: !0 });
Xr.ProgressCallbackTransform = void 0;
const Xm = Wr;
class Jm extends Xm.Transform {
  constructor(t, r, n) {
    super(), this.total = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.total * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, t(null);
  }
}
Xr.ProgressCallbackTransform = Jm;
Object.defineProperty(Ce, "__esModule", { value: !0 });
Ce.DigestTransform = Ce.HttpExecutor = Ce.HttpError = void 0;
Ce.createHttpError = Uo;
Ce.parseJson = ig;
Ce.configureRequestOptionsFromUrl = pu;
Ce.configureRequestUrl = ls;
Ce.safeGetHeader = nr;
Ce.configureRequestOptions = Bn;
Ce.safeStringifyJson = Hn;
const Km = zr, Qm = Ym, Zm = Le, eg = Wr, hu = lr, tg = yt, _a = ur, rg = Xr, yr = (0, Qm.default)("electron-builder");
function Uo(e, t = null) {
  return new as(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + Hn(e.headers), t);
}
const ng = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class as extends Error {
  constructor(t, r = `HTTP error: ${ng.get(t) || t}`, n = null) {
    super(r), this.statusCode = t, this.description = n, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
Ce.HttpError = as;
function ig(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class jn {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, r = new tg.CancellationToken(), n) {
    Bn(t);
    const i = n == null ? void 0 : JSON.stringify(n), o = i ? Buffer.from(i) : void 0;
    if (o != null) {
      yr(i);
      const { headers: s, ...a } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": o.length,
          ...s
        },
        ...a
      };
    }
    return this.doApiRequest(t, r, (s) => s.end(o));
  }
  doApiRequest(t, r, n, i = 0) {
    return yr.enabled && yr(`Request: ${Hn(t)}`), r.createPromise((o, s, a) => {
      const l = this.createRequest(t, (f) => {
        try {
          this.handleResponse(f, t, r, o, s, i, n);
        } catch (c) {
          s(c);
        }
      });
      this.addErrorAndTimeoutHandlers(l, s, t.timeout), this.addRedirectHandlers(l, t, s, i, (f) => {
        this.doApiRequest(f, r, n, i).then(o).catch(s);
      }), n(l, s), a(() => l.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, r, n, i, o) {
  }
  addErrorAndTimeoutHandlers(t, r, n = 60 * 1e3) {
    this.addTimeOutHandler(t, r, n), t.on("error", r), t.on("aborted", () => {
      r(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, r, n, i, o, s, a) {
    var l;
    if (yr.enabled && yr(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${Hn(r)}`), t.statusCode === 404) {
      o(Uo(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const f = (l = t.statusCode) !== null && l !== void 0 ? l : 0, c = f >= 300 && f < 400, u = nr(t, "location");
    if (c && u != null) {
      if (s > this.maxRedirects) {
        o(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(jn.prepareRedirectUrlOptions(u, r), n, a, s).then(i).catch(o);
      return;
    }
    t.setEncoding("utf8");
    let h = "";
    t.on("error", o), t.on("data", (m) => h += m), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const m = nr(t, "content-type"), w = m != null && (Array.isArray(m) ? m.find((y) => y.includes("json")) != null : m.includes("json"));
          o(Uo(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

          Data:
          ${w ? JSON.stringify(JSON.parse(h)) : h}
          `));
        } else
          i(h.length === 0 ? null : h);
      } catch (m) {
        o(m);
      }
    });
  }
  async downloadToBuffer(t, r) {
    return await r.cancellationToken.createPromise((n, i, o) => {
      const s = [], a = {
        headers: r.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      ls(t, a), Bn(a), this.doDownload(a, {
        destination: null,
        options: r,
        onCancel: o,
        callback: (l) => {
          l == null ? n(Buffer.concat(s)) : i(l);
        },
        responseHandler: (l, f) => {
          let c = 0;
          l.on("data", (u) => {
            if (c += u.length, c > 524288e3) {
              f(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            s.push(u);
          }), l.on("end", () => {
            f(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, r, n) {
    const i = this.createRequest(t, (o) => {
      if (o.statusCode >= 400) {
        r.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${o.statusCode}: ${o.statusMessage}`));
        return;
      }
      o.on("error", r.callback);
      const s = nr(o, "location");
      if (s != null) {
        n < this.maxRedirects ? this.doDownload(jn.prepareRedirectUrlOptions(s, t), r, n++) : r.callback(this.createMaxRedirectError());
        return;
      }
      r.responseHandler == null ? sg(r, o) : r.responseHandler(o, r.callback);
    });
    this.addErrorAndTimeoutHandlers(i, r.callback, t.timeout), this.addRedirectHandlers(i, t, r.callback, n, (o) => {
      this.doDownload(o, r, n++);
    }), i.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(t, r, n) {
    t.on("socket", (i) => {
      i.setTimeout(n, () => {
        t.abort(), r(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(t, r) {
    const n = pu(t, { ...r }), i = n.headers;
    if (i != null && i.authorization) {
      const o = new hu.URL(t);
      (o.hostname.endsWith(".amazonaws.com") || o.searchParams.has("X-Amz-Credential")) && delete i.authorization;
    }
    return n;
  }
  static retryOnServerError(t, r = 3) {
    for (let n = 0; ; n++)
      try {
        return t();
      } catch (i) {
        if (n < r && (i instanceof as && i.isServerError() || i.code === "EPIPE"))
          continue;
        throw i;
      }
  }
}
Ce.HttpExecutor = jn;
function pu(e, t) {
  const r = Bn(t);
  return ls(new hu.URL(e), r), r;
}
function ls(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class ko extends eg.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, r = "sha512", n = "base64") {
    super(), this.expected = t, this.algorithm = r, this.encoding = n, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, Km.createHash)(r);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(t, r, n) {
    this.digester.update(t), n(null, t);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(t) {
    if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
      try {
        this.validate();
      } catch (r) {
        t(r);
        return;
      }
    t(null);
  }
  validate() {
    if (this._actual == null)
      throw (0, _a.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, _a.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
Ce.DigestTransform = ko;
function og(e, t, r) {
  return e != null && t != null && e !== t ? (r(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function nr(e, t) {
  const r = e.headers[t];
  return r == null ? null : Array.isArray(r) ? r.length === 0 ? null : r[r.length - 1] : r;
}
function sg(e, t) {
  if (!og(nr(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const r = [];
  if (e.options.onProgress != null) {
    const s = nr(t, "content-length");
    s != null && r.push(new rg.ProgressCallbackTransform(parseInt(s, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const n = e.options.sha512;
  n != null ? r.push(new ko(n, "sha512", n.length === 128 && !n.includes("+") && !n.includes("Z") && !n.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && r.push(new ko(e.options.sha2, "sha256", "hex"));
  const i = (0, Zm.createWriteStream)(e.destination);
  r.push(i);
  let o = t;
  for (const s of r)
    s.on("error", (a) => {
      i.close(), e.options.cancellationToken.cancelled || e.callback(a);
    }), o = o.pipe(s);
  i.on("finish", () => {
    i.close(e.callback);
  });
}
function Bn(e, t, r) {
  r != null && (e.method = r), e.headers = { ...e.headers };
  const n = e.headers;
  return t != null && (n.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), n["User-Agent"] == null && (n["User-Agent"] = "electron-builder"), (r == null || r === "GET" || n["Cache-Control"] == null) && (n["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function Hn(e, t) {
  return JSON.stringify(e, (r, n) => r.endsWith("Authorization") || r.endsWith("authorization") || r.endsWith("Password") || r.endsWith("PASSWORD") || r.endsWith("Token") || r.includes("password") || r.includes("token") || t != null && t.has(r) ? "<stripped sensitive data>" : n, 2);
}
var ti = {};
Object.defineProperty(ti, "__esModule", { value: !0 });
ti.MemoLazy = void 0;
class ag {
  constructor(t, r) {
    this.selector = t, this.creator = r, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && mu(this.selected, t))
      return this._value;
    this.selected = t;
    const r = this.creator(t);
    return this.value = r, r;
  }
  set value(t) {
    this._value = t;
  }
}
ti.MemoLazy = ag;
function mu(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), o = Object.keys(t);
    return i.length === o.length && i.every((s) => mu(e[s], t[s]));
  }
  return e === t;
}
var ri = {};
Object.defineProperty(ri, "__esModule", { value: !0 });
ri.githubUrl = lg;
ri.getS3LikeProviderBaseUrl = cg;
function lg(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function cg(e) {
  const t = e.provider;
  if (t === "s3")
    return ug(e);
  if (t === "spaces")
    return fg(e);
  throw new Error(`Not supported provider: ${t}`);
}
function ug(e) {
  let t;
  if (e.accelerate == !0)
    t = `https://${e.bucket}.s3-accelerate.amazonaws.com`;
  else if (e.endpoint != null)
    t = `${e.endpoint}/${e.bucket}`;
  else if (e.bucket.includes(".")) {
    if (e.region == null)
      throw new Error(`Bucket name "${e.bucket}" includes a dot, but S3 region is missing`);
    e.region === "us-east-1" ? t = `https://s3.amazonaws.com/${e.bucket}` : t = `https://s3-${e.region}.amazonaws.com/${e.bucket}`;
  } else e.region === "cn-north-1" ? t = `https://${e.bucket}.s3.${e.region}.amazonaws.com.cn` : t = `https://${e.bucket}.s3.amazonaws.com`;
  return gu(t, e.path);
}
function gu(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function fg(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return gu(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var cs = {};
Object.defineProperty(cs, "__esModule", { value: !0 });
cs.retry = Eu;
const dg = yt;
async function Eu(e, t, r, n = 0, i = 0, o) {
  var s;
  const a = new dg.CancellationToken();
  try {
    return await e();
  } catch (l) {
    if ((!((s = o == null ? void 0 : o(l)) !== null && s !== void 0) || s) && t > 0 && !a.cancelled)
      return await new Promise((f) => setTimeout(f, r + n * i)), await Eu(e, t - 1, r, n, i + 1, o);
    throw l;
  }
}
var us = {};
Object.defineProperty(us, "__esModule", { value: !0 });
us.parseDn = hg;
function hg(e) {
  let t = !1, r = null, n = "", i = 0;
  e = e.trim();
  const o = /* @__PURE__ */ new Map();
  for (let s = 0; s <= e.length; s++) {
    if (s === e.length) {
      r !== null && o.set(r, n);
      break;
    }
    const a = e[s];
    if (t) {
      if (a === '"') {
        t = !1;
        continue;
      }
    } else {
      if (a === '"') {
        t = !0;
        continue;
      }
      if (a === "\\") {
        s++;
        const l = parseInt(e.slice(s, s + 2), 16);
        Number.isNaN(l) ? n += e[s] : (s++, n += String.fromCharCode(l));
        continue;
      }
      if (r === null && a === "=") {
        r = n, n = "";
        continue;
      }
      if (a === "," || a === ";" || a === "+") {
        r !== null && o.set(r, n), r = null, n = "";
        continue;
      }
    }
    if (a === " " && !t) {
      if (n.length === 0)
        continue;
      if (s > i) {
        let l = s;
        for (; e[l] === " "; )
          l++;
        i = l;
      }
      if (i >= e.length || e[i] === "," || e[i] === ";" || r === null && e[i] === "=" || r !== null && e[i] === "+") {
        s = i - 1;
        continue;
      }
    }
    n += a;
  }
  return o;
}
var sr = {};
Object.defineProperty(sr, "__esModule", { value: !0 });
sr.nil = sr.UUID = void 0;
const yu = zr, vu = ur, pg = "options.name must be either a string or a Buffer", Sa = (0, yu.randomBytes)(16);
Sa[0] = Sa[0] | 1;
const Fn = {}, X = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  Fn[t] = e, X[e] = t;
}
class Ut {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const r = Ut.check(t);
    if (!r)
      throw new Error("not a UUID");
    this.version = r.version, r.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, r) {
    return mg(t, "sha1", 80, r);
  }
  toString() {
    return this.ascii == null && (this.ascii = gg(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, r = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: (Fn[t[14] + t[15]] & 240) >> 4,
        variant: Aa((Fn[t[19] + t[20]] & 224) >> 5),
        format: "ascii"
      } : !1;
    if (Buffer.isBuffer(t)) {
      if (t.length < r + 16)
        return !1;
      let n = 0;
      for (; n < 16 && t[r + n] === 0; n++)
        ;
      return n === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
        version: (t[r + 6] & 240) >> 4,
        variant: Aa((t[r + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, vu.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const r = Buffer.allocUnsafe(16);
    let n = 0;
    for (let i = 0; i < 16; i++)
      r[i] = Fn[t[n++] + t[n++]], (i === 3 || i === 5 || i === 7 || i === 9) && (n += 1);
    return r;
  }
}
sr.UUID = Ut;
Ut.OID = Ut.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function Aa(e) {
  switch (e) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var Or;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Or || (Or = {}));
function mg(e, t, r, n, i = Or.ASCII) {
  const o = (0, yu.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, vu.newError)(pg, "ERR_INVALID_UUID_NAME");
  o.update(n), o.update(e);
  const a = o.digest();
  let l;
  switch (i) {
    case Or.BINARY:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = a;
      break;
    case Or.OBJECT:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = new Ut(a);
      break;
    default:
      l = X[a[0]] + X[a[1]] + X[a[2]] + X[a[3]] + "-" + X[a[4]] + X[a[5]] + "-" + X[a[6] & 15 | r] + X[a[7]] + "-" + X[a[8] & 63 | 128] + X[a[9]] + "-" + X[a[10]] + X[a[11]] + X[a[12]] + X[a[13]] + X[a[14]] + X[a[15]];
      break;
  }
  return l;
}
function gg(e) {
  return X[e[0]] + X[e[1]] + X[e[2]] + X[e[3]] + "-" + X[e[4]] + X[e[5]] + "-" + X[e[6]] + X[e[7]] + "-" + X[e[8]] + X[e[9]] + "-" + X[e[10]] + X[e[11]] + X[e[12]] + X[e[13]] + X[e[14]] + X[e[15]];
}
sr.nil = new Ut("00000000-0000-0000-0000-000000000000");
var Jr = {}, wu = {};
(function(e) {
  (function(t) {
    t.parser = function(p, d) {
      return new n(p, d);
    }, t.SAXParser = n, t.SAXStream = c, t.createStream = f, t.MAX_BUFFER_LENGTH = 64 * 1024;
    var r = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    t.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function n(p, d) {
      if (!(this instanceof n))
        return new n(p, d);
      var b = this;
      o(b), b.q = b.c = "", b.bufferCheckPosition = t.MAX_BUFFER_LENGTH, b.opt = d || {}, b.opt.lowercase = b.opt.lowercase || b.opt.lowercasetags, b.looseCase = b.opt.lowercase ? "toLowerCase" : "toUpperCase", b.tags = [], b.closed = b.closedRoot = b.sawRoot = !1, b.tag = b.error = null, b.strict = !!p, b.noscript = !!(p || b.opt.noscript), b.state = E.BEGIN, b.strictEntities = b.opt.strictEntities, b.ENTITIES = b.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), b.attribList = [], b.opt.xmlns && (b.ns = Object.create(y)), b.opt.unquotedAttributeValues === void 0 && (b.opt.unquotedAttributeValues = !p), b.trackPosition = b.opt.position !== !1, b.trackPosition && (b.position = b.line = b.column = 0), q(b, "onready");
    }
    Object.create || (Object.create = function(p) {
      function d() {
      }
      d.prototype = p;
      var b = new d();
      return b;
    }), Object.keys || (Object.keys = function(p) {
      var d = [];
      for (var b in p) p.hasOwnProperty(b) && d.push(b);
      return d;
    });
    function i(p) {
      for (var d = Math.max(t.MAX_BUFFER_LENGTH, 10), b = 0, S = 0, J = r.length; S < J; S++) {
        var re = p[r[S]].length;
        if (re > d)
          switch (r[S]) {
            case "textNode":
              Q(p);
              break;
            case "cdata":
              M(p, "oncdata", p.cdata), p.cdata = "";
              break;
            case "script":
              M(p, "onscript", p.script), p.script = "";
              break;
            default:
              O(p, "Max buffer length exceeded: " + r[S]);
          }
        b = Math.max(b, re);
      }
      var oe = t.MAX_BUFFER_LENGTH - b;
      p.bufferCheckPosition = oe + p.position;
    }
    function o(p) {
      for (var d = 0, b = r.length; d < b; d++)
        p[r[d]] = "";
    }
    function s(p) {
      Q(p), p.cdata !== "" && (M(p, "oncdata", p.cdata), p.cdata = ""), p.script !== "" && (M(p, "onscript", p.script), p.script = "");
    }
    n.prototype = {
      end: function() {
        N(this);
      },
      write: ze,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        s(this);
      }
    };
    var a;
    try {
      a = require("stream").Stream;
    } catch {
      a = function() {
      };
    }
    a || (a = function() {
    });
    var l = t.EVENTS.filter(function(p) {
      return p !== "error" && p !== "end";
    });
    function f(p, d) {
      return new c(p, d);
    }
    function c(p, d) {
      if (!(this instanceof c))
        return new c(p, d);
      a.apply(this), this._parser = new n(p, d), this.writable = !0, this.readable = !0;
      var b = this;
      this._parser.onend = function() {
        b.emit("end");
      }, this._parser.onerror = function(S) {
        b.emit("error", S), b._parser.error = null;
      }, this._decoder = null, l.forEach(function(S) {
        Object.defineProperty(b, "on" + S, {
          get: function() {
            return b._parser["on" + S];
          },
          set: function(J) {
            if (!J)
              return b.removeAllListeners(S), b._parser["on" + S] = J, J;
            b.on(S, J);
          },
          enumerable: !0,
          configurable: !1
        });
      });
    }
    c.prototype = Object.create(a.prototype, {
      constructor: {
        value: c
      }
    }), c.prototype.write = function(p) {
      if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(p)) {
        if (!this._decoder) {
          var d = Vd.StringDecoder;
          this._decoder = new d("utf8");
        }
        p = this._decoder.write(p);
      }
      return this._parser.write(p.toString()), this.emit("data", p), !0;
    }, c.prototype.end = function(p) {
      return p && p.length && this.write(p), this._parser.end(), !0;
    }, c.prototype.on = function(p, d) {
      var b = this;
      return !b._parser["on" + p] && l.indexOf(p) !== -1 && (b._parser["on" + p] = function() {
        var S = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        S.splice(0, 0, p), b.emit.apply(b, S);
      }), a.prototype.on.call(b, p, d);
    };
    var u = "[CDATA[", h = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", w = "http://www.w3.org/2000/xmlns/", y = { xml: m, xmlns: w }, _ = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, A = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, T = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, P = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function L(p) {
      return p === " " || p === `
` || p === "\r" || p === "	";
    }
    function B(p) {
      return p === '"' || p === "'";
    }
    function H(p) {
      return p === ">" || L(p);
    }
    function j(p, d) {
      return p.test(d);
    }
    function ae(p, d) {
      return !j(p, d);
    }
    var E = 0;
    t.STATE = {
      BEGIN: E++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: E++,
      // leading whitespace
      TEXT: E++,
      // general stuff
      TEXT_ENTITY: E++,
      // &amp and such.
      OPEN_WAKA: E++,
      // <
      SGML_DECL: E++,
      // <!BLARG
      SGML_DECL_QUOTED: E++,
      // <!BLARG foo "bar
      DOCTYPE: E++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: E++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: E++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: E++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: E++,
      // <!-
      COMMENT: E++,
      // <!--
      COMMENT_ENDING: E++,
      // <!-- blah -
      COMMENT_ENDED: E++,
      // <!-- blah --
      CDATA: E++,
      // <![CDATA[ something
      CDATA_ENDING: E++,
      // ]
      CDATA_ENDING_2: E++,
      // ]]
      PROC_INST: E++,
      // <?hi
      PROC_INST_BODY: E++,
      // <?hi there
      PROC_INST_ENDING: E++,
      // <?hi "there" ?
      OPEN_TAG: E++,
      // <strong
      OPEN_TAG_SLASH: E++,
      // <strong /
      ATTRIB: E++,
      // <a
      ATTRIB_NAME: E++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: E++,
      // <a foo _
      ATTRIB_VALUE: E++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: E++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: E++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: E++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: E++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: E++,
      // <foo bar=&quot
      CLOSE_TAG: E++,
      // </a
      CLOSE_TAG_SAW_WHITE: E++,
      // </a   >
      SCRIPT: E++,
      // <script> ...
      SCRIPT_ENDING: E++
      // <script> ... <
    }, t.XML_ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    }, t.ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    }, Object.keys(t.ENTITIES).forEach(function(p) {
      var d = t.ENTITIES[p], b = typeof d == "number" ? String.fromCharCode(d) : d;
      t.ENTITIES[p] = b;
    });
    for (var z in t.STATE)
      t.STATE[t.STATE[z]] = z;
    E = t.STATE;
    function q(p, d, b) {
      p[d] && p[d](b);
    }
    function M(p, d, b) {
      p.textNode && Q(p), q(p, d, b);
    }
    function Q(p) {
      p.textNode = R(p.opt, p.textNode), p.textNode && q(p, "ontext", p.textNode), p.textNode = "";
    }
    function R(p, d) {
      return p.trim && (d = d.trim()), p.normalize && (d = d.replace(/\s+/g, " ")), d;
    }
    function O(p, d) {
      return Q(p), p.trackPosition && (d += `
Line: ` + p.line + `
Column: ` + p.column + `
Char: ` + p.c), d = new Error(d), p.error = d, q(p, "onerror", d), p;
    }
    function N(p) {
      return p.sawRoot && !p.closedRoot && C(p, "Unclosed root tag"), p.state !== E.BEGIN && p.state !== E.BEGIN_WHITESPACE && p.state !== E.TEXT && O(p, "Unexpected end"), Q(p), p.c = "", p.closed = !0, q(p, "onend"), n.call(p, p.strict, p.opt), p;
    }
    function C(p, d) {
      if (typeof p != "object" || !(p instanceof n))
        throw new Error("bad call to strictFail");
      p.strict && O(p, d);
    }
    function D(p) {
      p.strict || (p.tagName = p.tagName[p.looseCase]());
      var d = p.tags[p.tags.length - 1] || p, b = p.tag = { name: p.tagName, attributes: {} };
      p.opt.xmlns && (b.ns = d.ns), p.attribList.length = 0, M(p, "onopentagstart", b);
    }
    function I(p, d) {
      var b = p.indexOf(":"), S = b < 0 ? ["", p] : p.split(":"), J = S[0], re = S[1];
      return d && p === "xmlns" && (J = "xmlns", re = ""), { prefix: J, local: re };
    }
    function k(p) {
      if (p.strict || (p.attribName = p.attribName[p.looseCase]()), p.attribList.indexOf(p.attribName) !== -1 || p.tag.attributes.hasOwnProperty(p.attribName)) {
        p.attribName = p.attribValue = "";
        return;
      }
      if (p.opt.xmlns) {
        var d = I(p.attribName, !0), b = d.prefix, S = d.local;
        if (b === "xmlns")
          if (S === "xml" && p.attribValue !== m)
            C(
              p,
              "xml: prefix must be bound to " + m + `
Actual: ` + p.attribValue
            );
          else if (S === "xmlns" && p.attribValue !== w)
            C(
              p,
              "xmlns: prefix must be bound to " + w + `
Actual: ` + p.attribValue
            );
          else {
            var J = p.tag, re = p.tags[p.tags.length - 1] || p;
            J.ns === re.ns && (J.ns = Object.create(re.ns)), J.ns[S] = p.attribValue;
          }
        p.attribList.push([p.attribName, p.attribValue]);
      } else
        p.tag.attributes[p.attribName] = p.attribValue, M(p, "onattribute", {
          name: p.attribName,
          value: p.attribValue
        });
      p.attribName = p.attribValue = "";
    }
    function Y(p, d) {
      if (p.opt.xmlns) {
        var b = p.tag, S = I(p.tagName);
        b.prefix = S.prefix, b.local = S.local, b.uri = b.ns[S.prefix] || "", b.prefix && !b.uri && (C(p, "Unbound namespace prefix: " + JSON.stringify(p.tagName)), b.uri = S.prefix);
        var J = p.tags[p.tags.length - 1] || p;
        b.ns && J.ns !== b.ns && Object.keys(b.ns).forEach(function(sn) {
          M(p, "onopennamespace", {
            prefix: sn,
            uri: b.ns[sn]
          });
        });
        for (var re = 0, oe = p.attribList.length; re < oe; re++) {
          var me = p.attribList[re], we = me[0], ot = me[1], ce = I(we, !0), je = ce.prefix, wi = ce.local, on = je === "" ? "" : b.ns[je] || "", hr = {
            name: we,
            value: ot,
            prefix: je,
            local: wi,
            uri: on
          };
          je && je !== "xmlns" && !on && (C(p, "Unbound namespace prefix: " + JSON.stringify(je)), hr.uri = je), p.tag.attributes[we] = hr, M(p, "onattribute", hr);
        }
        p.attribList.length = 0;
      }
      p.tag.isSelfClosing = !!d, p.sawRoot = !0, p.tags.push(p.tag), M(p, "onopentag", p.tag), d || (!p.noscript && p.tagName.toLowerCase() === "script" ? p.state = E.SCRIPT : p.state = E.TEXT, p.tag = null, p.tagName = ""), p.attribName = p.attribValue = "", p.attribList.length = 0;
    }
    function G(p) {
      if (!p.tagName) {
        C(p, "Weird empty close tag."), p.textNode += "</>", p.state = E.TEXT;
        return;
      }
      if (p.script) {
        if (p.tagName !== "script") {
          p.script += "</" + p.tagName + ">", p.tagName = "", p.state = E.SCRIPT;
          return;
        }
        M(p, "onscript", p.script), p.script = "";
      }
      var d = p.tags.length, b = p.tagName;
      p.strict || (b = b[p.looseCase]());
      for (var S = b; d--; ) {
        var J = p.tags[d];
        if (J.name !== S)
          C(p, "Unexpected close tag");
        else
          break;
      }
      if (d < 0) {
        C(p, "Unmatched closing tag: " + p.tagName), p.textNode += "</" + p.tagName + ">", p.state = E.TEXT;
        return;
      }
      p.tagName = b;
      for (var re = p.tags.length; re-- > d; ) {
        var oe = p.tag = p.tags.pop();
        p.tagName = p.tag.name, M(p, "onclosetag", p.tagName);
        var me = {};
        for (var we in oe.ns)
          me[we] = oe.ns[we];
        var ot = p.tags[p.tags.length - 1] || p;
        p.opt.xmlns && oe.ns !== ot.ns && Object.keys(oe.ns).forEach(function(ce) {
          var je = oe.ns[ce];
          M(p, "onclosenamespace", { prefix: ce, uri: je });
        });
      }
      d === 0 && (p.closedRoot = !0), p.tagName = p.attribValue = p.attribName = "", p.attribList.length = 0, p.state = E.TEXT;
    }
    function Z(p) {
      var d = p.entity, b = d.toLowerCase(), S, J = "";
      return p.ENTITIES[d] ? p.ENTITIES[d] : p.ENTITIES[b] ? p.ENTITIES[b] : (d = b, d.charAt(0) === "#" && (d.charAt(1) === "x" ? (d = d.slice(2), S = parseInt(d, 16), J = S.toString(16)) : (d = d.slice(1), S = parseInt(d, 10), J = S.toString(10))), d = d.replace(/^0+/, ""), isNaN(S) || J.toLowerCase() !== d ? (C(p, "Invalid character entity"), "&" + p.entity + ";") : String.fromCodePoint(S));
    }
    function fe(p, d) {
      d === "<" ? (p.state = E.OPEN_WAKA, p.startTagPosition = p.position) : L(d) || (C(p, "Non-whitespace before first tag."), p.textNode = d, p.state = E.TEXT);
    }
    function U(p, d) {
      var b = "";
      return d < p.length && (b = p.charAt(d)), b;
    }
    function ze(p) {
      var d = this;
      if (this.error)
        throw this.error;
      if (d.closed)
        return O(
          d,
          "Cannot write after close. Assign an onready handler."
        );
      if (p === null)
        return N(d);
      typeof p == "object" && (p = p.toString());
      for (var b = 0, S = ""; S = U(p, b++), d.c = S, !!S; )
        switch (d.trackPosition && (d.position++, S === `
` ? (d.line++, d.column = 0) : d.column++), d.state) {
          case E.BEGIN:
            if (d.state = E.BEGIN_WHITESPACE, S === "\uFEFF")
              continue;
            fe(d, S);
            continue;
          case E.BEGIN_WHITESPACE:
            fe(d, S);
            continue;
          case E.TEXT:
            if (d.sawRoot && !d.closedRoot) {
              for (var J = b - 1; S && S !== "<" && S !== "&"; )
                S = U(p, b++), S && d.trackPosition && (d.position++, S === `
` ? (d.line++, d.column = 0) : d.column++);
              d.textNode += p.substring(J, b - 1);
            }
            S === "<" && !(d.sawRoot && d.closedRoot && !d.strict) ? (d.state = E.OPEN_WAKA, d.startTagPosition = d.position) : (!L(S) && (!d.sawRoot || d.closedRoot) && C(d, "Text data outside of root node."), S === "&" ? d.state = E.TEXT_ENTITY : d.textNode += S);
            continue;
          case E.SCRIPT:
            S === "<" ? d.state = E.SCRIPT_ENDING : d.script += S;
            continue;
          case E.SCRIPT_ENDING:
            S === "/" ? d.state = E.CLOSE_TAG : (d.script += "<" + S, d.state = E.SCRIPT);
            continue;
          case E.OPEN_WAKA:
            if (S === "!")
              d.state = E.SGML_DECL, d.sgmlDecl = "";
            else if (!L(S)) if (j(_, S))
              d.state = E.OPEN_TAG, d.tagName = S;
            else if (S === "/")
              d.state = E.CLOSE_TAG, d.tagName = "";
            else if (S === "?")
              d.state = E.PROC_INST, d.procInstName = d.procInstBody = "";
            else {
              if (C(d, "Unencoded <"), d.startTagPosition + 1 < d.position) {
                var re = d.position - d.startTagPosition;
                S = new Array(re).join(" ") + S;
              }
              d.textNode += "<" + S, d.state = E.TEXT;
            }
            continue;
          case E.SGML_DECL:
            if (d.sgmlDecl + S === "--") {
              d.state = E.COMMENT, d.comment = "", d.sgmlDecl = "";
              continue;
            }
            d.doctype && d.doctype !== !0 && d.sgmlDecl ? (d.state = E.DOCTYPE_DTD, d.doctype += "<!" + d.sgmlDecl + S, d.sgmlDecl = "") : (d.sgmlDecl + S).toUpperCase() === u ? (M(d, "onopencdata"), d.state = E.CDATA, d.sgmlDecl = "", d.cdata = "") : (d.sgmlDecl + S).toUpperCase() === h ? (d.state = E.DOCTYPE, (d.doctype || d.sawRoot) && C(
              d,
              "Inappropriately located doctype declaration"
            ), d.doctype = "", d.sgmlDecl = "") : S === ">" ? (M(d, "onsgmldeclaration", d.sgmlDecl), d.sgmlDecl = "", d.state = E.TEXT) : (B(S) && (d.state = E.SGML_DECL_QUOTED), d.sgmlDecl += S);
            continue;
          case E.SGML_DECL_QUOTED:
            S === d.q && (d.state = E.SGML_DECL, d.q = ""), d.sgmlDecl += S;
            continue;
          case E.DOCTYPE:
            S === ">" ? (d.state = E.TEXT, M(d, "ondoctype", d.doctype), d.doctype = !0) : (d.doctype += S, S === "[" ? d.state = E.DOCTYPE_DTD : B(S) && (d.state = E.DOCTYPE_QUOTED, d.q = S));
            continue;
          case E.DOCTYPE_QUOTED:
            d.doctype += S, S === d.q && (d.q = "", d.state = E.DOCTYPE);
            continue;
          case E.DOCTYPE_DTD:
            S === "]" ? (d.doctype += S, d.state = E.DOCTYPE) : S === "<" ? (d.state = E.OPEN_WAKA, d.startTagPosition = d.position) : B(S) ? (d.doctype += S, d.state = E.DOCTYPE_DTD_QUOTED, d.q = S) : d.doctype += S;
            continue;
          case E.DOCTYPE_DTD_QUOTED:
            d.doctype += S, S === d.q && (d.state = E.DOCTYPE_DTD, d.q = "");
            continue;
          case E.COMMENT:
            S === "-" ? d.state = E.COMMENT_ENDING : d.comment += S;
            continue;
          case E.COMMENT_ENDING:
            S === "-" ? (d.state = E.COMMENT_ENDED, d.comment = R(d.opt, d.comment), d.comment && M(d, "oncomment", d.comment), d.comment = "") : (d.comment += "-" + S, d.state = E.COMMENT);
            continue;
          case E.COMMENT_ENDED:
            S !== ">" ? (C(d, "Malformed comment"), d.comment += "--" + S, d.state = E.COMMENT) : d.doctype && d.doctype !== !0 ? d.state = E.DOCTYPE_DTD : d.state = E.TEXT;
            continue;
          case E.CDATA:
            S === "]" ? d.state = E.CDATA_ENDING : d.cdata += S;
            continue;
          case E.CDATA_ENDING:
            S === "]" ? d.state = E.CDATA_ENDING_2 : (d.cdata += "]" + S, d.state = E.CDATA);
            continue;
          case E.CDATA_ENDING_2:
            S === ">" ? (d.cdata && M(d, "oncdata", d.cdata), M(d, "onclosecdata"), d.cdata = "", d.state = E.TEXT) : S === "]" ? d.cdata += "]" : (d.cdata += "]]" + S, d.state = E.CDATA);
            continue;
          case E.PROC_INST:
            S === "?" ? d.state = E.PROC_INST_ENDING : L(S) ? d.state = E.PROC_INST_BODY : d.procInstName += S;
            continue;
          case E.PROC_INST_BODY:
            if (!d.procInstBody && L(S))
              continue;
            S === "?" ? d.state = E.PROC_INST_ENDING : d.procInstBody += S;
            continue;
          case E.PROC_INST_ENDING:
            S === ">" ? (M(d, "onprocessinginstruction", {
              name: d.procInstName,
              body: d.procInstBody
            }), d.procInstName = d.procInstBody = "", d.state = E.TEXT) : (d.procInstBody += "?" + S, d.state = E.PROC_INST_BODY);
            continue;
          case E.OPEN_TAG:
            j(A, S) ? d.tagName += S : (D(d), S === ">" ? Y(d) : S === "/" ? d.state = E.OPEN_TAG_SLASH : (L(S) || C(d, "Invalid character in tag name"), d.state = E.ATTRIB));
            continue;
          case E.OPEN_TAG_SLASH:
            S === ">" ? (Y(d, !0), G(d)) : (C(d, "Forward-slash in opening tag not followed by >"), d.state = E.ATTRIB);
            continue;
          case E.ATTRIB:
            if (L(S))
              continue;
            S === ">" ? Y(d) : S === "/" ? d.state = E.OPEN_TAG_SLASH : j(_, S) ? (d.attribName = S, d.attribValue = "", d.state = E.ATTRIB_NAME) : C(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME:
            S === "=" ? d.state = E.ATTRIB_VALUE : S === ">" ? (C(d, "Attribute without value"), d.attribValue = d.attribName, k(d), Y(d)) : L(S) ? d.state = E.ATTRIB_NAME_SAW_WHITE : j(A, S) ? d.attribName += S : C(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME_SAW_WHITE:
            if (S === "=")
              d.state = E.ATTRIB_VALUE;
            else {
              if (L(S))
                continue;
              C(d, "Attribute without value"), d.tag.attributes[d.attribName] = "", d.attribValue = "", M(d, "onattribute", {
                name: d.attribName,
                value: ""
              }), d.attribName = "", S === ">" ? Y(d) : j(_, S) ? (d.attribName = S, d.state = E.ATTRIB_NAME) : (C(d, "Invalid attribute name"), d.state = E.ATTRIB);
            }
            continue;
          case E.ATTRIB_VALUE:
            if (L(S))
              continue;
            B(S) ? (d.q = S, d.state = E.ATTRIB_VALUE_QUOTED) : (d.opt.unquotedAttributeValues || O(d, "Unquoted attribute value"), d.state = E.ATTRIB_VALUE_UNQUOTED, d.attribValue = S);
            continue;
          case E.ATTRIB_VALUE_QUOTED:
            if (S !== d.q) {
              S === "&" ? d.state = E.ATTRIB_VALUE_ENTITY_Q : d.attribValue += S;
              continue;
            }
            k(d), d.q = "", d.state = E.ATTRIB_VALUE_CLOSED;
            continue;
          case E.ATTRIB_VALUE_CLOSED:
            L(S) ? d.state = E.ATTRIB : S === ">" ? Y(d) : S === "/" ? d.state = E.OPEN_TAG_SLASH : j(_, S) ? (C(d, "No whitespace between attributes"), d.attribName = S, d.attribValue = "", d.state = E.ATTRIB_NAME) : C(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_VALUE_UNQUOTED:
            if (!H(S)) {
              S === "&" ? d.state = E.ATTRIB_VALUE_ENTITY_U : d.attribValue += S;
              continue;
            }
            k(d), S === ">" ? Y(d) : d.state = E.ATTRIB;
            continue;
          case E.CLOSE_TAG:
            if (d.tagName)
              S === ">" ? G(d) : j(A, S) ? d.tagName += S : d.script ? (d.script += "</" + d.tagName, d.tagName = "", d.state = E.SCRIPT) : (L(S) || C(d, "Invalid tagname in closing tag"), d.state = E.CLOSE_TAG_SAW_WHITE);
            else {
              if (L(S))
                continue;
              ae(_, S) ? d.script ? (d.script += "</" + S, d.state = E.SCRIPT) : C(d, "Invalid tagname in closing tag.") : d.tagName = S;
            }
            continue;
          case E.CLOSE_TAG_SAW_WHITE:
            if (L(S))
              continue;
            S === ">" ? G(d) : C(d, "Invalid characters in closing tag");
            continue;
          case E.TEXT_ENTITY:
          case E.ATTRIB_VALUE_ENTITY_Q:
          case E.ATTRIB_VALUE_ENTITY_U:
            var oe, me;
            switch (d.state) {
              case E.TEXT_ENTITY:
                oe = E.TEXT, me = "textNode";
                break;
              case E.ATTRIB_VALUE_ENTITY_Q:
                oe = E.ATTRIB_VALUE_QUOTED, me = "attribValue";
                break;
              case E.ATTRIB_VALUE_ENTITY_U:
                oe = E.ATTRIB_VALUE_UNQUOTED, me = "attribValue";
                break;
            }
            if (S === ";") {
              var we = Z(d);
              d.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(we) ? (d.entity = "", d.state = oe, d.write(we)) : (d[me] += we, d.entity = "", d.state = oe);
            } else j(d.entity.length ? P : T, S) ? d.entity += S : (C(d, "Invalid character in entity name"), d[me] += "&" + d.entity + S, d.entity = "", d.state = oe);
            continue;
          default:
            throw new Error(d, "Unknown state: " + d.state);
        }
      return d.position >= d.bufferCheckPosition && i(d), d;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var p = String.fromCharCode, d = Math.floor, b = function() {
        var S = 16384, J = [], re, oe, me = -1, we = arguments.length;
        if (!we)
          return "";
        for (var ot = ""; ++me < we; ) {
          var ce = Number(arguments[me]);
          if (!isFinite(ce) || // `NaN`, `+Infinity`, or `-Infinity`
          ce < 0 || // not a valid Unicode code point
          ce > 1114111 || // not a valid Unicode code point
          d(ce) !== ce)
            throw RangeError("Invalid code point: " + ce);
          ce <= 65535 ? J.push(ce) : (ce -= 65536, re = (ce >> 10) + 55296, oe = ce % 1024 + 56320, J.push(re, oe)), (me + 1 === we || J.length > S) && (ot += p.apply(null, J), J.length = 0);
        }
        return ot;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: b,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = b;
    }();
  })(e);
})(wu);
Object.defineProperty(Jr, "__esModule", { value: !0 });
Jr.XElement = void 0;
Jr.parseXml = wg;
const Eg = wu, wn = ur;
class _u {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, wn.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!vg(t))
      throw (0, wn.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const r = this.attributes === null ? null : this.attributes[t];
    if (r == null)
      throw (0, wn.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return r;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, r = !1, n = null) {
    const i = this.elementOrNull(t, r);
    if (i === null)
      throw (0, wn.newError)(n || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return i;
  }
  elementOrNull(t, r = !1) {
    if (this.elements === null)
      return null;
    for (const n of this.elements)
      if (Ta(n, t, r))
        return n;
    return null;
  }
  getElements(t, r = !1) {
    return this.elements === null ? [] : this.elements.filter((n) => Ta(n, t, r));
  }
  elementValueOrEmpty(t, r = !1) {
    const n = this.elementOrNull(t, r);
    return n === null ? "" : n.value;
  }
}
Jr.XElement = _u;
const yg = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function vg(e) {
  return yg.test(e);
}
function Ta(e, t, r) {
  const n = e.name;
  return n === t || r === !0 && n.length === t.length && n.toLowerCase() === t.toLowerCase();
}
function wg(e) {
  let t = null;
  const r = Eg.parser(!0, {}), n = [];
  return r.onopentag = (i) => {
    const o = new _u(i.name);
    if (o.attributes = i.attributes, t === null)
      t = o;
    else {
      const s = n[n.length - 1];
      s.elements == null && (s.elements = []), s.elements.push(o);
    }
    n.push(o);
  }, r.onclosetag = () => {
    n.pop();
  }, r.ontext = (i) => {
    n.length > 0 && (n[n.length - 1].value = i);
  }, r.oncdata = (i) => {
    const o = n[n.length - 1];
    o.value = i, o.isCData = !0;
  }, r.onerror = (i) => {
    throw i;
  }, r.write(e), t;
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = u;
  var t = yt;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var r = ur;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return r.newError;
  } });
  var n = Ce;
  Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
    return n.configureRequestOptions;
  } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
    return n.configureRequestOptionsFromUrl;
  } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
    return n.configureRequestUrl;
  } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
    return n.createHttpError;
  } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
    return n.DigestTransform;
  } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
    return n.HttpError;
  } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
    return n.HttpExecutor;
  } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
    return n.parseJson;
  } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
    return n.safeGetHeader;
  } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
    return n.safeStringifyJson;
  } });
  var i = ti;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var o = Xr;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return o.ProgressCallbackTransform;
  } });
  var s = ri;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return s.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return s.githubUrl;
  } });
  var a = cs;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return a.retry;
  } });
  var l = us;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return l.parseDn;
  } });
  var f = sr;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return f.UUID;
  } });
  var c = Jr;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return c.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return c.XElement;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  function u(h) {
    return h == null ? [] : Array.isArray(h) ? h : [h];
  }
})(pe);
var ve = {}, fs = {}, Ge = {};
function Su(e) {
  return typeof e > "u" || e === null;
}
function _g(e) {
  return typeof e == "object" && e !== null;
}
function Sg(e) {
  return Array.isArray(e) ? e : Su(e) ? [] : [e];
}
function Ag(e, t) {
  var r, n, i, o;
  if (t)
    for (o = Object.keys(t), r = 0, n = o.length; r < n; r += 1)
      i = o[r], e[i] = t[i];
  return e;
}
function Tg(e, t) {
  var r = "", n;
  for (n = 0; n < t; n += 1)
    r += e;
  return r;
}
function bg(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Ge.isNothing = Su;
Ge.isObject = _g;
Ge.toArray = Sg;
Ge.repeat = Tg;
Ge.isNegativeZero = bg;
Ge.extend = Ag;
function Au(e, t) {
  var r = "", n = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (r += 'in "' + e.mark.name + '" '), r += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (r += `

` + e.mark.snippet), n + " " + r) : n;
}
function Lr(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = Au(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
Lr.prototype = Object.create(Error.prototype);
Lr.prototype.constructor = Lr;
Lr.prototype.toString = function(t) {
  return this.name + ": " + Au(this, t);
};
var Kr = Lr, Ar = Ge;
function xi(e, t, r, n, i) {
  var o = "", s = "", a = Math.floor(i / 2) - 1;
  return n - t > a && (o = " ... ", t = n - a + o.length), r - n > a && (s = " ...", r = n + a - s.length), {
    str: o + e.slice(t, r).replace(/\t/g, "→") + s,
    pos: n - t + o.length
    // relative position
  };
}
function Ui(e, t) {
  return Ar.repeat(" ", t - e.length) + e;
}
function Cg(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], i = [], o, s = -1; o = r.exec(e.buffer); )
    i.push(o.index), n.push(o.index + o[0].length), e.position <= o.index && s < 0 && (s = n.length - 2);
  s < 0 && (s = n.length - 1);
  var a = "", l, f, c = Math.min(e.line + t.linesAfter, i.length).toString().length, u = t.maxLength - (t.indent + c + 3);
  for (l = 1; l <= t.linesBefore && !(s - l < 0); l++)
    f = xi(
      e.buffer,
      n[s - l],
      i[s - l],
      e.position - (n[s] - n[s - l]),
      u
    ), a = Ar.repeat(" ", t.indent) + Ui((e.line - l + 1).toString(), c) + " | " + f.str + `
` + a;
  for (f = xi(e.buffer, n[s], i[s], e.position, u), a += Ar.repeat(" ", t.indent) + Ui((e.line + 1).toString(), c) + " | " + f.str + `
`, a += Ar.repeat("-", t.indent + c + 3 + f.pos) + `^
`, l = 1; l <= t.linesAfter && !(s + l >= i.length); l++)
    f = xi(
      e.buffer,
      n[s + l],
      i[s + l],
      e.position - (n[s] - n[s + l]),
      u
    ), a += Ar.repeat(" ", t.indent) + Ui((e.line + l + 1).toString(), c) + " | " + f.str + `
`;
  return a.replace(/\n$/, "");
}
var Og = Cg, ba = Kr, $g = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], Rg = [
  "scalar",
  "sequence",
  "mapping"
];
function Ig(e) {
  var t = {};
  return e !== null && Object.keys(e).forEach(function(r) {
    e[r].forEach(function(n) {
      t[String(n)] = r;
    });
  }), t;
}
function Ng(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(r) {
    if ($g.indexOf(r) === -1)
      throw new ba('Unknown option "' + r + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(r) {
    return r;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = Ig(t.styleAliases || null), Rg.indexOf(this.kind) === -1)
    throw new ba('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var Ie = Ng, vr = Kr, ki = Ie;
function Ca(e, t) {
  var r = [];
  return e[t].forEach(function(n) {
    var i = r.length;
    r.forEach(function(o, s) {
      o.tag === n.tag && o.kind === n.kind && o.multi === n.multi && (i = s);
    }), r[i] = n;
  }), r;
}
function Pg() {
  var e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, t, r;
  function n(i) {
    i.multi ? (e.multi[i.kind].push(i), e.multi.fallback.push(i)) : e[i.kind][i.tag] = e.fallback[i.tag] = i;
  }
  for (t = 0, r = arguments.length; t < r; t += 1)
    arguments[t].forEach(n);
  return e;
}
function Mo(e) {
  return this.extend(e);
}
Mo.prototype.extend = function(t) {
  var r = [], n = [];
  if (t instanceof ki)
    n.push(t);
  else if (Array.isArray(t))
    n = n.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (r = r.concat(t.implicit)), t.explicit && (n = n.concat(t.explicit));
  else
    throw new vr("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(o) {
    if (!(o instanceof ki))
      throw new vr("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (o.loadKind && o.loadKind !== "scalar")
      throw new vr("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (o.multi)
      throw new vr("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(o) {
    if (!(o instanceof ki))
      throw new vr("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var i = Object.create(Mo.prototype);
  return i.implicit = (this.implicit || []).concat(r), i.explicit = (this.explicit || []).concat(n), i.compiledImplicit = Ca(i, "implicit"), i.compiledExplicit = Ca(i, "explicit"), i.compiledTypeMap = Pg(i.compiledImplicit, i.compiledExplicit), i;
};
var Tu = Mo, Dg = Ie, bu = new Dg("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), Fg = Ie, Cu = new Fg("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), Lg = Ie, Ou = new Lg("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), xg = Tu, $u = new xg({
  explicit: [
    bu,
    Cu,
    Ou
  ]
}), Ug = Ie;
function kg(e) {
  if (e === null) return !0;
  var t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function Mg() {
  return null;
}
function jg(e) {
  return e === null;
}
var Ru = new Ug("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: kg,
  construct: Mg,
  predicate: jg,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
}), Bg = Ie;
function Hg(e) {
  if (e === null) return !1;
  var t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function qg(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function Gg(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var Iu = new Bg("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: Hg,
  construct: qg,
  predicate: Gg,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
}), Wg = Ge, Vg = Ie;
function zg(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function Yg(e) {
  return 48 <= e && e <= 55;
}
function Xg(e) {
  return 48 <= e && e <= 57;
}
function Jg(e) {
  if (e === null) return !1;
  var t = e.length, r = 0, n = !1, i;
  if (!t) return !1;
  if (i = e[r], (i === "-" || i === "+") && (i = e[++r]), i === "0") {
    if (r + 1 === t) return !0;
    if (i = e[++r], i === "b") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (i !== "0" && i !== "1") return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "x") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!zg(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "o") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!Yg(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
  }
  if (i === "_") return !1;
  for (; r < t; r++)
    if (i = e[r], i !== "_") {
      if (!Xg(e.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || i === "_");
}
function Kg(e) {
  var t = e, r = 1, n;
  if (t.indexOf("_") !== -1 && (t = t.replace(/_/g, "")), n = t[0], (n === "-" || n === "+") && (n === "-" && (r = -1), t = t.slice(1), n = t[0]), t === "0") return 0;
  if (n === "0") {
    if (t[1] === "b") return r * parseInt(t.slice(2), 2);
    if (t[1] === "x") return r * parseInt(t.slice(2), 16);
    if (t[1] === "o") return r * parseInt(t.slice(2), 8);
  }
  return r * parseInt(t, 10);
}
function Qg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !Wg.isNegativeZero(e);
}
var Nu = new Vg("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: Jg,
  construct: Kg,
  predicate: Qg,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
}), Pu = Ge, Zg = Ie, e0 = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function t0(e) {
  return !(e === null || !e0.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function r0(e) {
  var t, r;
  return t = e.replace(/_/g, "").toLowerCase(), r = t[0] === "-" ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : r * parseFloat(t, 10);
}
var n0 = /^[-+]?[0-9]+e/;
function i0(e, t) {
  var r;
  if (isNaN(e))
    switch (t) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (Pu.isNegativeZero(e))
    return "-0.0";
  return r = e.toString(10), n0.test(r) ? r.replace("e", ".e") : r;
}
function o0(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || Pu.isNegativeZero(e));
}
var Du = new Zg("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: t0,
  construct: r0,
  predicate: o0,
  represent: i0,
  defaultStyle: "lowercase"
}), Fu = $u.extend({
  implicit: [
    Ru,
    Iu,
    Nu,
    Du
  ]
}), Lu = Fu, s0 = Ie, xu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), Uu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function a0(e) {
  return e === null ? !1 : xu.exec(e) !== null || Uu.exec(e) !== null;
}
function l0(e) {
  var t, r, n, i, o, s, a, l = 0, f = null, c, u, h;
  if (t = xu.exec(e), t === null && (t = Uu.exec(e)), t === null) throw new Error("Date resolve error");
  if (r = +t[1], n = +t[2] - 1, i = +t[3], !t[4])
    return new Date(Date.UTC(r, n, i));
  if (o = +t[4], s = +t[5], a = +t[6], t[7]) {
    for (l = t[7].slice(0, 3); l.length < 3; )
      l += "0";
    l = +l;
  }
  return t[9] && (c = +t[10], u = +(t[11] || 0), f = (c * 60 + u) * 6e4, t[9] === "-" && (f = -f)), h = new Date(Date.UTC(r, n, i, o, s, a, l)), f && h.setTime(h.getTime() - f), h;
}
function c0(e) {
  return e.toISOString();
}
var ku = new s0("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: a0,
  construct: l0,
  instanceOf: Date,
  represent: c0
}), u0 = Ie;
function f0(e) {
  return e === "<<" || e === null;
}
var Mu = new u0("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: f0
}), d0 = Ie, ds = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function h0(e) {
  if (e === null) return !1;
  var t, r, n = 0, i = e.length, o = ds;
  for (r = 0; r < i; r++)
    if (t = o.indexOf(e.charAt(r)), !(t > 64)) {
      if (t < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function p0(e) {
  var t, r, n = e.replace(/[\r\n=]/g, ""), i = n.length, o = ds, s = 0, a = [];
  for (t = 0; t < i; t++)
    t % 4 === 0 && t && (a.push(s >> 16 & 255), a.push(s >> 8 & 255), a.push(s & 255)), s = s << 6 | o.indexOf(n.charAt(t));
  return r = i % 4 * 6, r === 0 ? (a.push(s >> 16 & 255), a.push(s >> 8 & 255), a.push(s & 255)) : r === 18 ? (a.push(s >> 10 & 255), a.push(s >> 2 & 255)) : r === 12 && a.push(s >> 4 & 255), new Uint8Array(a);
}
function m0(e) {
  var t = "", r = 0, n, i, o = e.length, s = ds;
  for (n = 0; n < o; n++)
    n % 3 === 0 && n && (t += s[r >> 18 & 63], t += s[r >> 12 & 63], t += s[r >> 6 & 63], t += s[r & 63]), r = (r << 8) + e[n];
  return i = o % 3, i === 0 ? (t += s[r >> 18 & 63], t += s[r >> 12 & 63], t += s[r >> 6 & 63], t += s[r & 63]) : i === 2 ? (t += s[r >> 10 & 63], t += s[r >> 4 & 63], t += s[r << 2 & 63], t += s[64]) : i === 1 && (t += s[r >> 2 & 63], t += s[r << 4 & 63], t += s[64], t += s[64]), t;
}
function g0(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var ju = new d0("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: h0,
  construct: p0,
  predicate: g0,
  represent: m0
}), E0 = Ie, y0 = Object.prototype.hasOwnProperty, v0 = Object.prototype.toString;
function w0(e) {
  if (e === null) return !0;
  var t = [], r, n, i, o, s, a = e;
  for (r = 0, n = a.length; r < n; r += 1) {
    if (i = a[r], s = !1, v0.call(i) !== "[object Object]") return !1;
    for (o in i)
      if (y0.call(i, o))
        if (!s) s = !0;
        else return !1;
    if (!s) return !1;
    if (t.indexOf(o) === -1) t.push(o);
    else return !1;
  }
  return !0;
}
function _0(e) {
  return e !== null ? e : [];
}
var Bu = new E0("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: w0,
  construct: _0
}), S0 = Ie, A0 = Object.prototype.toString;
function T0(e) {
  if (e === null) return !0;
  var t, r, n, i, o, s = e;
  for (o = new Array(s.length), t = 0, r = s.length; t < r; t += 1) {
    if (n = s[t], A0.call(n) !== "[object Object]" || (i = Object.keys(n), i.length !== 1)) return !1;
    o[t] = [i[0], n[i[0]]];
  }
  return !0;
}
function b0(e) {
  if (e === null) return [];
  var t, r, n, i, o, s = e;
  for (o = new Array(s.length), t = 0, r = s.length; t < r; t += 1)
    n = s[t], i = Object.keys(n), o[t] = [i[0], n[i[0]]];
  return o;
}
var Hu = new S0("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: T0,
  construct: b0
}), C0 = Ie, O0 = Object.prototype.hasOwnProperty;
function $0(e) {
  if (e === null) return !0;
  var t, r = e;
  for (t in r)
    if (O0.call(r, t) && r[t] !== null)
      return !1;
  return !0;
}
function R0(e) {
  return e !== null ? e : {};
}
var qu = new C0("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: $0,
  construct: R0
}), hs = Lu.extend({
  implicit: [
    ku,
    Mu
  ],
  explicit: [
    ju,
    Bu,
    Hu,
    qu
  ]
}), Dt = Ge, Gu = Kr, I0 = Og, N0 = hs, vt = Object.prototype.hasOwnProperty, qn = 1, Wu = 2, Vu = 3, Gn = 4, Mi = 1, P0 = 2, Oa = 3, D0 = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, F0 = /[\x85\u2028\u2029]/, L0 = /[,\[\]\{\}]/, zu = /^(?:!|!!|![a-z\-]+!)$/i, Yu = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function $a(e) {
  return Object.prototype.toString.call(e);
}
function Qe(e) {
  return e === 10 || e === 13;
}
function xt(e) {
  return e === 9 || e === 32;
}
function Fe(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function Kt(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function x0(e) {
  var t;
  return 48 <= e && e <= 57 ? e - 48 : (t = e | 32, 97 <= t && t <= 102 ? t - 97 + 10 : -1);
}
function U0(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function k0(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function Ra(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function M0(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
var Xu = new Array(256), Ju = new Array(256);
for (var Gt = 0; Gt < 256; Gt++)
  Xu[Gt] = Ra(Gt) ? 1 : 0, Ju[Gt] = Ra(Gt);
function j0(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || N0, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function Ku(e, t) {
  var r = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return r.snippet = I0(r), new Gu(t, r);
}
function x(e, t) {
  throw Ku(e, t);
}
function Wn(e, t) {
  e.onWarning && e.onWarning.call(null, Ku(e, t));
}
var Ia = {
  YAML: function(t, r, n) {
    var i, o, s;
    t.version !== null && x(t, "duplication of %YAML directive"), n.length !== 1 && x(t, "YAML directive accepts exactly one argument"), i = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), i === null && x(t, "ill-formed argument of the YAML directive"), o = parseInt(i[1], 10), s = parseInt(i[2], 10), o !== 1 && x(t, "unacceptable YAML version of the document"), t.version = n[0], t.checkLineBreaks = s < 2, s !== 1 && s !== 2 && Wn(t, "unsupported YAML version of the document");
  },
  TAG: function(t, r, n) {
    var i, o;
    n.length !== 2 && x(t, "TAG directive accepts exactly two arguments"), i = n[0], o = n[1], zu.test(i) || x(t, "ill-formed tag handle (first argument) of the TAG directive"), vt.call(t.tagMap, i) && x(t, 'there is a previously declared suffix for "' + i + '" tag handle'), Yu.test(o) || x(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      o = decodeURIComponent(o);
    } catch {
      x(t, "tag prefix is malformed: " + o);
    }
    t.tagMap[i] = o;
  }
};
function mt(e, t, r, n) {
  var i, o, s, a;
  if (t < r) {
    if (a = e.input.slice(t, r), n)
      for (i = 0, o = a.length; i < o; i += 1)
        s = a.charCodeAt(i), s === 9 || 32 <= s && s <= 1114111 || x(e, "expected valid JSON character");
    else D0.test(a) && x(e, "the stream contains non-printable characters");
    e.result += a;
  }
}
function Na(e, t, r, n) {
  var i, o, s, a;
  for (Dt.isObject(r) || x(e, "cannot merge mappings; the provided source object is unacceptable"), i = Object.keys(r), s = 0, a = i.length; s < a; s += 1)
    o = i[s], vt.call(t, o) || (t[o] = r[o], n[o] = !0);
}
function Qt(e, t, r, n, i, o, s, a, l) {
  var f, c;
  if (Array.isArray(i))
    for (i = Array.prototype.slice.call(i), f = 0, c = i.length; f < c; f += 1)
      Array.isArray(i[f]) && x(e, "nested arrays are not supported inside keys"), typeof i == "object" && $a(i[f]) === "[object Object]" && (i[f] = "[object Object]");
  if (typeof i == "object" && $a(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(o))
      for (f = 0, c = o.length; f < c; f += 1)
        Na(e, t, o[f], r);
    else
      Na(e, t, o, r);
  else
    !e.json && !vt.call(r, i) && vt.call(t, i) && (e.line = s || e.line, e.lineStart = a || e.lineStart, e.position = l || e.position, x(e, "duplicated mapping key")), i === "__proto__" ? Object.defineProperty(t, i, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: o
    }) : t[i] = o, delete r[i];
  return t;
}
function ps(e) {
  var t;
  t = e.input.charCodeAt(e.position), t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : x(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function le(e, t, r) {
  for (var n = 0, i = e.input.charCodeAt(e.position); i !== 0; ) {
    for (; xt(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (Qe(i))
      for (ps(e), i = e.input.charCodeAt(e.position), n++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && e.lineIndent < r && Wn(e, "deficient indentation"), n;
}
function ni(e) {
  var t = e.position, r;
  return r = e.input.charCodeAt(t), !!((r === 45 || r === 46) && r === e.input.charCodeAt(t + 1) && r === e.input.charCodeAt(t + 2) && (t += 3, r = e.input.charCodeAt(t), r === 0 || Fe(r)));
}
function ms(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += Dt.repeat(`
`, t - 1));
}
function B0(e, t, r) {
  var n, i, o, s, a, l, f, c, u = e.kind, h = e.result, m;
  if (m = e.input.charCodeAt(e.position), Fe(m) || Kt(m) || m === 35 || m === 38 || m === 42 || m === 33 || m === 124 || m === 62 || m === 39 || m === 34 || m === 37 || m === 64 || m === 96 || (m === 63 || m === 45) && (i = e.input.charCodeAt(e.position + 1), Fe(i) || r && Kt(i)))
    return !1;
  for (e.kind = "scalar", e.result = "", o = s = e.position, a = !1; m !== 0; ) {
    if (m === 58) {
      if (i = e.input.charCodeAt(e.position + 1), Fe(i) || r && Kt(i))
        break;
    } else if (m === 35) {
      if (n = e.input.charCodeAt(e.position - 1), Fe(n))
        break;
    } else {
      if (e.position === e.lineStart && ni(e) || r && Kt(m))
        break;
      if (Qe(m))
        if (l = e.line, f = e.lineStart, c = e.lineIndent, le(e, !1, -1), e.lineIndent >= t) {
          a = !0, m = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = s, e.line = l, e.lineStart = f, e.lineIndent = c;
          break;
        }
    }
    a && (mt(e, o, s, !1), ms(e, e.line - l), o = s = e.position, a = !1), xt(m) || (s = e.position + 1), m = e.input.charCodeAt(++e.position);
  }
  return mt(e, o, s, !1), e.result ? !0 : (e.kind = u, e.result = h, !1);
}
function H0(e, t) {
  var r, n, i;
  if (r = e.input.charCodeAt(e.position), r !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = i = e.position; (r = e.input.charCodeAt(e.position)) !== 0; )
    if (r === 39)
      if (mt(e, n, e.position, !0), r = e.input.charCodeAt(++e.position), r === 39)
        n = e.position, e.position++, i = e.position;
      else
        return !0;
    else Qe(r) ? (mt(e, n, i, !0), ms(e, le(e, !1, t)), n = i = e.position) : e.position === e.lineStart && ni(e) ? x(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
  x(e, "unexpected end of the stream within a single quoted scalar");
}
function q0(e, t) {
  var r, n, i, o, s, a;
  if (a = e.input.charCodeAt(e.position), a !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, r = n = e.position; (a = e.input.charCodeAt(e.position)) !== 0; ) {
    if (a === 34)
      return mt(e, r, e.position, !0), e.position++, !0;
    if (a === 92) {
      if (mt(e, r, e.position, !0), a = e.input.charCodeAt(++e.position), Qe(a))
        le(e, !1, t);
      else if (a < 256 && Xu[a])
        e.result += Ju[a], e.position++;
      else if ((s = U0(a)) > 0) {
        for (i = s, o = 0; i > 0; i--)
          a = e.input.charCodeAt(++e.position), (s = x0(a)) >= 0 ? o = (o << 4) + s : x(e, "expected hexadecimal character");
        e.result += M0(o), e.position++;
      } else
        x(e, "unknown escape sequence");
      r = n = e.position;
    } else Qe(a) ? (mt(e, r, n, !0), ms(e, le(e, !1, t)), r = n = e.position) : e.position === e.lineStart && ni(e) ? x(e, "unexpected end of the document within a double quoted scalar") : (e.position++, n = e.position);
  }
  x(e, "unexpected end of the stream within a double quoted scalar");
}
function G0(e, t) {
  var r = !0, n, i, o, s = e.tag, a, l = e.anchor, f, c, u, h, m, w = /* @__PURE__ */ Object.create(null), y, _, A, T;
  if (T = e.input.charCodeAt(e.position), T === 91)
    c = 93, m = !1, a = [];
  else if (T === 123)
    c = 125, m = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = a), T = e.input.charCodeAt(++e.position); T !== 0; ) {
    if (le(e, !0, t), T = e.input.charCodeAt(e.position), T === c)
      return e.position++, e.tag = s, e.anchor = l, e.kind = m ? "mapping" : "sequence", e.result = a, !0;
    r ? T === 44 && x(e, "expected the node content, but found ','") : x(e, "missed comma between flow collection entries"), _ = y = A = null, u = h = !1, T === 63 && (f = e.input.charCodeAt(e.position + 1), Fe(f) && (u = h = !0, e.position++, le(e, !0, t))), n = e.line, i = e.lineStart, o = e.position, ar(e, t, qn, !1, !0), _ = e.tag, y = e.result, le(e, !0, t), T = e.input.charCodeAt(e.position), (h || e.line === n) && T === 58 && (u = !0, T = e.input.charCodeAt(++e.position), le(e, !0, t), ar(e, t, qn, !1, !0), A = e.result), m ? Qt(e, a, w, _, y, A, n, i, o) : u ? a.push(Qt(e, null, w, _, y, A, n, i, o)) : a.push(y), le(e, !0, t), T = e.input.charCodeAt(e.position), T === 44 ? (r = !0, T = e.input.charCodeAt(++e.position)) : r = !1;
  }
  x(e, "unexpected end of the stream within a flow collection");
}
function W0(e, t) {
  var r, n, i = Mi, o = !1, s = !1, a = t, l = 0, f = !1, c, u;
  if (u = e.input.charCodeAt(e.position), u === 124)
    n = !1;
  else if (u === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; u !== 0; )
    if (u = e.input.charCodeAt(++e.position), u === 43 || u === 45)
      Mi === i ? i = u === 43 ? Oa : P0 : x(e, "repeat of a chomping mode identifier");
    else if ((c = k0(u)) >= 0)
      c === 0 ? x(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : s ? x(e, "repeat of an indentation width identifier") : (a = t + c - 1, s = !0);
    else
      break;
  if (xt(u)) {
    do
      u = e.input.charCodeAt(++e.position);
    while (xt(u));
    if (u === 35)
      do
        u = e.input.charCodeAt(++e.position);
      while (!Qe(u) && u !== 0);
  }
  for (; u !== 0; ) {
    for (ps(e), e.lineIndent = 0, u = e.input.charCodeAt(e.position); (!s || e.lineIndent < a) && u === 32; )
      e.lineIndent++, u = e.input.charCodeAt(++e.position);
    if (!s && e.lineIndent > a && (a = e.lineIndent), Qe(u)) {
      l++;
      continue;
    }
    if (e.lineIndent < a) {
      i === Oa ? e.result += Dt.repeat(`
`, o ? 1 + l : l) : i === Mi && o && (e.result += `
`);
      break;
    }
    for (n ? xt(u) ? (f = !0, e.result += Dt.repeat(`
`, o ? 1 + l : l)) : f ? (f = !1, e.result += Dt.repeat(`
`, l + 1)) : l === 0 ? o && (e.result += " ") : e.result += Dt.repeat(`
`, l) : e.result += Dt.repeat(`
`, o ? 1 + l : l), o = !0, s = !0, l = 0, r = e.position; !Qe(u) && u !== 0; )
      u = e.input.charCodeAt(++e.position);
    mt(e, r, e.position, !1);
  }
  return !0;
}
function Pa(e, t) {
  var r, n = e.tag, i = e.anchor, o = [], s, a = !1, l;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = o), l = e.input.charCodeAt(e.position); l !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), !(l !== 45 || (s = e.input.charCodeAt(e.position + 1), !Fe(s)))); ) {
    if (a = !0, e.position++, le(e, !0, -1) && e.lineIndent <= t) {
      o.push(null), l = e.input.charCodeAt(e.position);
      continue;
    }
    if (r = e.line, ar(e, t, Vu, !1, !0), o.push(e.result), le(e, !0, -1), l = e.input.charCodeAt(e.position), (e.line === r || e.lineIndent > t) && l !== 0)
      x(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return a ? (e.tag = n, e.anchor = i, e.kind = "sequence", e.result = o, !0) : !1;
}
function V0(e, t, r) {
  var n, i, o, s, a, l, f = e.tag, c = e.anchor, u = {}, h = /* @__PURE__ */ Object.create(null), m = null, w = null, y = null, _ = !1, A = !1, T;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = u), T = e.input.charCodeAt(e.position); T !== 0; ) {
    if (!_ && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), n = e.input.charCodeAt(e.position + 1), o = e.line, (T === 63 || T === 58) && Fe(n))
      T === 63 ? (_ && (Qt(e, u, h, m, w, null, s, a, l), m = w = y = null), A = !0, _ = !0, i = !0) : _ ? (_ = !1, i = !0) : x(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, T = n;
    else {
      if (s = e.line, a = e.lineStart, l = e.position, !ar(e, r, Wu, !1, !0))
        break;
      if (e.line === o) {
        for (T = e.input.charCodeAt(e.position); xt(T); )
          T = e.input.charCodeAt(++e.position);
        if (T === 58)
          T = e.input.charCodeAt(++e.position), Fe(T) || x(e, "a whitespace character is expected after the key-value separator within a block mapping"), _ && (Qt(e, u, h, m, w, null, s, a, l), m = w = y = null), A = !0, _ = !1, i = !1, m = e.tag, w = e.result;
        else if (A)
          x(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = f, e.anchor = c, !0;
      } else if (A)
        x(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = f, e.anchor = c, !0;
    }
    if ((e.line === o || e.lineIndent > t) && (_ && (s = e.line, a = e.lineStart, l = e.position), ar(e, t, Gn, !0, i) && (_ ? w = e.result : y = e.result), _ || (Qt(e, u, h, m, w, y, s, a, l), m = w = y = null), le(e, !0, -1), T = e.input.charCodeAt(e.position)), (e.line === o || e.lineIndent > t) && T !== 0)
      x(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return _ && Qt(e, u, h, m, w, null, s, a, l), A && (e.tag = f, e.anchor = c, e.kind = "mapping", e.result = u), A;
}
function z0(e) {
  var t, r = !1, n = !1, i, o, s;
  if (s = e.input.charCodeAt(e.position), s !== 33) return !1;
  if (e.tag !== null && x(e, "duplication of a tag property"), s = e.input.charCodeAt(++e.position), s === 60 ? (r = !0, s = e.input.charCodeAt(++e.position)) : s === 33 ? (n = !0, i = "!!", s = e.input.charCodeAt(++e.position)) : i = "!", t = e.position, r) {
    do
      s = e.input.charCodeAt(++e.position);
    while (s !== 0 && s !== 62);
    e.position < e.length ? (o = e.input.slice(t, e.position), s = e.input.charCodeAt(++e.position)) : x(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; s !== 0 && !Fe(s); )
      s === 33 && (n ? x(e, "tag suffix cannot contain exclamation marks") : (i = e.input.slice(t - 1, e.position + 1), zu.test(i) || x(e, "named tag handle cannot contain such characters"), n = !0, t = e.position + 1)), s = e.input.charCodeAt(++e.position);
    o = e.input.slice(t, e.position), L0.test(o) && x(e, "tag suffix cannot contain flow indicator characters");
  }
  o && !Yu.test(o) && x(e, "tag name cannot contain such characters: " + o);
  try {
    o = decodeURIComponent(o);
  } catch {
    x(e, "tag name is malformed: " + o);
  }
  return r ? e.tag = o : vt.call(e.tagMap, i) ? e.tag = e.tagMap[i] + o : i === "!" ? e.tag = "!" + o : i === "!!" ? e.tag = "tag:yaml.org,2002:" + o : x(e, 'undeclared tag handle "' + i + '"'), !0;
}
function Y0(e) {
  var t, r;
  if (r = e.input.charCodeAt(e.position), r !== 38) return !1;
  for (e.anchor !== null && x(e, "duplication of an anchor property"), r = e.input.charCodeAt(++e.position), t = e.position; r !== 0 && !Fe(r) && !Kt(r); )
    r = e.input.charCodeAt(++e.position);
  return e.position === t && x(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0;
}
function X0(e) {
  var t, r, n;
  if (n = e.input.charCodeAt(e.position), n !== 42) return !1;
  for (n = e.input.charCodeAt(++e.position), t = e.position; n !== 0 && !Fe(n) && !Kt(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === t && x(e, "name of an alias node must contain at least one character"), r = e.input.slice(t, e.position), vt.call(e.anchorMap, r) || x(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], le(e, !0, -1), !0;
}
function ar(e, t, r, n, i) {
  var o, s, a, l = 1, f = !1, c = !1, u, h, m, w, y, _;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, o = s = a = Gn === r || Vu === r, n && le(e, !0, -1) && (f = !0, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)), l === 1)
    for (; z0(e) || Y0(e); )
      le(e, !0, -1) ? (f = !0, a = o, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)) : a = !1;
  if (a && (a = f || i), (l === 1 || Gn === r) && (qn === r || Wu === r ? y = t : y = t + 1, _ = e.position - e.lineStart, l === 1 ? a && (Pa(e, _) || V0(e, _, y)) || G0(e, y) ? c = !0 : (s && W0(e, y) || H0(e, y) || q0(e, y) ? c = !0 : X0(e) ? (c = !0, (e.tag !== null || e.anchor !== null) && x(e, "alias node should not have any properties")) : B0(e, y, qn === r) && (c = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : l === 0 && (c = a && Pa(e, _))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && x(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), u = 0, h = e.implicitTypes.length; u < h; u += 1)
      if (w = e.implicitTypes[u], w.resolve(e.result)) {
        e.result = w.construct(e.result), e.tag = w.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (vt.call(e.typeMap[e.kind || "fallback"], e.tag))
      w = e.typeMap[e.kind || "fallback"][e.tag];
    else
      for (w = null, m = e.typeMap.multi[e.kind || "fallback"], u = 0, h = m.length; u < h; u += 1)
        if (e.tag.slice(0, m[u].tag.length) === m[u].tag) {
          w = m[u];
          break;
        }
    w || x(e, "unknown tag !<" + e.tag + ">"), e.result !== null && w.kind !== e.kind && x(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + w.kind + '", not "' + e.kind + '"'), w.resolve(e.result, e.tag) ? (e.result = w.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : x(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || c;
}
function J0(e) {
  var t = e.position, r, n, i, o = !1, s;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (s = e.input.charCodeAt(e.position)) !== 0 && (le(e, !0, -1), s = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || s !== 37)); ) {
    for (o = !0, s = e.input.charCodeAt(++e.position), r = e.position; s !== 0 && !Fe(s); )
      s = e.input.charCodeAt(++e.position);
    for (n = e.input.slice(r, e.position), i = [], n.length < 1 && x(e, "directive name must not be less than one character in length"); s !== 0; ) {
      for (; xt(s); )
        s = e.input.charCodeAt(++e.position);
      if (s === 35) {
        do
          s = e.input.charCodeAt(++e.position);
        while (s !== 0 && !Qe(s));
        break;
      }
      if (Qe(s)) break;
      for (r = e.position; s !== 0 && !Fe(s); )
        s = e.input.charCodeAt(++e.position);
      i.push(e.input.slice(r, e.position));
    }
    s !== 0 && ps(e), vt.call(Ia, n) ? Ia[n](e, n, i) : Wn(e, 'unknown document directive "' + n + '"');
  }
  if (le(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, le(e, !0, -1)) : o && x(e, "directives end mark is expected"), ar(e, e.lineIndent - 1, Gn, !1, !0), le(e, !0, -1), e.checkLineBreaks && F0.test(e.input.slice(t, e.position)) && Wn(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && ni(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, le(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    x(e, "end of the stream or a document separator is expected");
  else
    return;
}
function Qu(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var r = new j0(e, t), n = e.indexOf("\0");
  for (n !== -1 && (r.position = n, x(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    J0(r);
  return r.documents;
}
function K0(e, t, r) {
  t !== null && typeof t == "object" && typeof r > "u" && (r = t, t = null);
  var n = Qu(e, r);
  if (typeof t != "function")
    return n;
  for (var i = 0, o = n.length; i < o; i += 1)
    t(n[i]);
}
function Q0(e, t) {
  var r = Qu(e, t);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new Gu("expected a single document in the stream, but found more");
  }
}
fs.loadAll = K0;
fs.load = Q0;
var Zu = {}, ii = Ge, Qr = Kr, Z0 = hs, ef = Object.prototype.toString, tf = Object.prototype.hasOwnProperty, gs = 65279, eE = 9, xr = 10, tE = 13, rE = 32, nE = 33, iE = 34, jo = 35, oE = 37, sE = 38, aE = 39, lE = 42, rf = 44, cE = 45, Vn = 58, uE = 61, fE = 62, dE = 63, hE = 64, nf = 91, of = 93, pE = 96, sf = 123, mE = 124, af = 125, Ae = {};
Ae[0] = "\\0";
Ae[7] = "\\a";
Ae[8] = "\\b";
Ae[9] = "\\t";
Ae[10] = "\\n";
Ae[11] = "\\v";
Ae[12] = "\\f";
Ae[13] = "\\r";
Ae[27] = "\\e";
Ae[34] = '\\"';
Ae[92] = "\\\\";
Ae[133] = "\\N";
Ae[160] = "\\_";
Ae[8232] = "\\L";
Ae[8233] = "\\P";
var gE = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], EE = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function yE(e, t) {
  var r, n, i, o, s, a, l;
  if (t === null) return {};
  for (r = {}, n = Object.keys(t), i = 0, o = n.length; i < o; i += 1)
    s = n[i], a = String(t[s]), s.slice(0, 2) === "!!" && (s = "tag:yaml.org,2002:" + s.slice(2)), l = e.compiledTypeMap.fallback[s], l && tf.call(l.styleAliases, a) && (a = l.styleAliases[a]), r[s] = a;
  return r;
}
function vE(e) {
  var t, r, n;
  if (t = e.toString(16).toUpperCase(), e <= 255)
    r = "x", n = 2;
  else if (e <= 65535)
    r = "u", n = 4;
  else if (e <= 4294967295)
    r = "U", n = 8;
  else
    throw new Qr("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + r + ii.repeat("0", n - t.length) + t;
}
var wE = 1, Ur = 2;
function _E(e) {
  this.schema = e.schema || Z0, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = ii.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = yE(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? Ur : wE, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function Da(e, t) {
  for (var r = ii.repeat(" ", t), n = 0, i = -1, o = "", s, a = e.length; n < a; )
    i = e.indexOf(`
`, n), i === -1 ? (s = e.slice(n), n = a) : (s = e.slice(n, i + 1), n = i + 1), s.length && s !== `
` && (o += r), o += s;
  return o;
}
function Bo(e, t) {
  return `
` + ii.repeat(" ", e.indent * t);
}
function SE(e, t) {
  var r, n, i;
  for (r = 0, n = e.implicitTypes.length; r < n; r += 1)
    if (i = e.implicitTypes[r], i.resolve(t))
      return !0;
  return !1;
}
function zn(e) {
  return e === rE || e === eE;
}
function kr(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== gs || 65536 <= e && e <= 1114111;
}
function Fa(e) {
  return kr(e) && e !== gs && e !== tE && e !== xr;
}
function La(e, t, r) {
  var n = Fa(e), i = n && !zn(e);
  return (
    // ns-plain-safe
    (r ? (
      // c = flow-in
      n
    ) : n && e !== rf && e !== nf && e !== of && e !== sf && e !== af) && e !== jo && !(t === Vn && !i) || Fa(t) && !zn(t) && e === jo || t === Vn && i
  );
}
function AE(e) {
  return kr(e) && e !== gs && !zn(e) && e !== cE && e !== dE && e !== Vn && e !== rf && e !== nf && e !== of && e !== sf && e !== af && e !== jo && e !== sE && e !== lE && e !== nE && e !== mE && e !== uE && e !== fE && e !== aE && e !== iE && e !== oE && e !== hE && e !== pE;
}
function TE(e) {
  return !zn(e) && e !== Vn;
}
function Tr(e, t) {
  var r = e.charCodeAt(t), n;
  return r >= 55296 && r <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1), n >= 56320 && n <= 57343) ? (r - 55296) * 1024 + n - 56320 + 65536 : r;
}
function lf(e) {
  var t = /^\n* /;
  return t.test(e);
}
var cf = 1, Ho = 2, uf = 3, ff = 4, Jt = 5;
function bE(e, t, r, n, i, o, s, a) {
  var l, f = 0, c = null, u = !1, h = !1, m = n !== -1, w = -1, y = AE(Tr(e, 0)) && TE(Tr(e, e.length - 1));
  if (t || s)
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Tr(e, l), !kr(f))
        return Jt;
      y = y && La(f, c, a), c = f;
    }
  else {
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Tr(e, l), f === xr)
        u = !0, m && (h = h || // Foldable line = too long, and not more-indented.
        l - w - 1 > n && e[w + 1] !== " ", w = l);
      else if (!kr(f))
        return Jt;
      y = y && La(f, c, a), c = f;
    }
    h = h || m && l - w - 1 > n && e[w + 1] !== " ";
  }
  return !u && !h ? y && !s && !i(e) ? cf : o === Ur ? Jt : Ho : r > 9 && lf(e) ? Jt : s ? o === Ur ? Jt : Ho : h ? ff : uf;
}
function CE(e, t, r, n, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === Ur ? '""' : "''";
    if (!e.noCompatMode && (gE.indexOf(t) !== -1 || EE.test(t)))
      return e.quotingType === Ur ? '"' + t + '"' : "'" + t + "'";
    var o = e.indent * Math.max(1, r), s = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - o), a = n || e.flowLevel > -1 && r >= e.flowLevel;
    function l(f) {
      return SE(e, f);
    }
    switch (bE(
      t,
      a,
      e.indent,
      s,
      l,
      e.quotingType,
      e.forceQuotes && !n,
      i
    )) {
      case cf:
        return t;
      case Ho:
        return "'" + t.replace(/'/g, "''") + "'";
      case uf:
        return "|" + xa(t, e.indent) + Ua(Da(t, o));
      case ff:
        return ">" + xa(t, e.indent) + Ua(Da(OE(t, s), o));
      case Jt:
        return '"' + $E(t) + '"';
      default:
        throw new Qr("impossible error: invalid scalar style");
    }
  }();
}
function xa(e, t) {
  var r = lf(e) ? String(t) : "", n = e[e.length - 1] === `
`, i = n && (e[e.length - 2] === `
` || e === `
`), o = i ? "+" : n ? "" : "-";
  return r + o + `
`;
}
function Ua(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function OE(e, t) {
  for (var r = /(\n+)([^\n]*)/g, n = function() {
    var f = e.indexOf(`
`);
    return f = f !== -1 ? f : e.length, r.lastIndex = f, ka(e.slice(0, f), t);
  }(), i = e[0] === `
` || e[0] === " ", o, s; s = r.exec(e); ) {
    var a = s[1], l = s[2];
    o = l[0] === " ", n += a + (!i && !o && l !== "" ? `
` : "") + ka(l, t), i = o;
  }
  return n;
}
function ka(e, t) {
  if (e === "" || e[0] === " ") return e;
  for (var r = / [^ ]/g, n, i = 0, o, s = 0, a = 0, l = ""; n = r.exec(e); )
    a = n.index, a - i > t && (o = s > i ? s : a, l += `
` + e.slice(i, o), i = o + 1), s = a;
  return l += `
`, e.length - i > t && s > i ? l += e.slice(i, s) + `
` + e.slice(s + 1) : l += e.slice(i), l.slice(1);
}
function $E(e) {
  for (var t = "", r = 0, n, i = 0; i < e.length; r >= 65536 ? i += 2 : i++)
    r = Tr(e, i), n = Ae[r], !n && kr(r) ? (t += e[i], r >= 65536 && (t += e[i + 1])) : t += n || vE(r);
  return t;
}
function RE(e, t, r) {
  var n = "", i = e.tag, o, s, a;
  for (o = 0, s = r.length; o < s; o += 1)
    a = r[o], e.replacer && (a = e.replacer.call(r, String(o), a)), (nt(e, t, a, !1, !1) || typeof a > "u" && nt(e, t, null, !1, !1)) && (n !== "" && (n += "," + (e.condenseFlow ? "" : " ")), n += e.dump);
  e.tag = i, e.dump = "[" + n + "]";
}
function Ma(e, t, r, n) {
  var i = "", o = e.tag, s, a, l;
  for (s = 0, a = r.length; s < a; s += 1)
    l = r[s], e.replacer && (l = e.replacer.call(r, String(s), l)), (nt(e, t + 1, l, !0, !0, !1, !0) || typeof l > "u" && nt(e, t + 1, null, !0, !0, !1, !0)) && ((!n || i !== "") && (i += Bo(e, t)), e.dump && xr === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  e.tag = o, e.dump = i || "[]";
}
function IE(e, t, r) {
  var n = "", i = e.tag, o = Object.keys(r), s, a, l, f, c;
  for (s = 0, a = o.length; s < a; s += 1)
    c = "", n !== "" && (c += ", "), e.condenseFlow && (c += '"'), l = o[s], f = r[l], e.replacer && (f = e.replacer.call(r, l, f)), nt(e, t, l, !1, !1) && (e.dump.length > 1024 && (c += "? "), c += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), nt(e, t, f, !1, !1) && (c += e.dump, n += c));
  e.tag = i, e.dump = "{" + n + "}";
}
function NE(e, t, r, n) {
  var i = "", o = e.tag, s = Object.keys(r), a, l, f, c, u, h;
  if (e.sortKeys === !0)
    s.sort();
  else if (typeof e.sortKeys == "function")
    s.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new Qr("sortKeys must be a boolean or a function");
  for (a = 0, l = s.length; a < l; a += 1)
    h = "", (!n || i !== "") && (h += Bo(e, t)), f = s[a], c = r[f], e.replacer && (c = e.replacer.call(r, f, c)), nt(e, t + 1, f, !0, !0, !0) && (u = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, u && (e.dump && xr === e.dump.charCodeAt(0) ? h += "?" : h += "? "), h += e.dump, u && (h += Bo(e, t)), nt(e, t + 1, c, !0, u) && (e.dump && xr === e.dump.charCodeAt(0) ? h += ":" : h += ": ", h += e.dump, i += h));
  e.tag = o, e.dump = i || "{}";
}
function ja(e, t, r) {
  var n, i, o, s, a, l;
  for (i = r ? e.explicitTypes : e.implicitTypes, o = 0, s = i.length; o < s; o += 1)
    if (a = i[o], (a.instanceOf || a.predicate) && (!a.instanceOf || typeof t == "object" && t instanceof a.instanceOf) && (!a.predicate || a.predicate(t))) {
      if (r ? a.multi && a.representName ? e.tag = a.representName(t) : e.tag = a.tag : e.tag = "?", a.represent) {
        if (l = e.styleMap[a.tag] || a.defaultStyle, ef.call(a.represent) === "[object Function]")
          n = a.represent(t, l);
        else if (tf.call(a.represent, l))
          n = a.represent[l](t, l);
        else
          throw new Qr("!<" + a.tag + '> tag resolver accepts not "' + l + '" style');
        e.dump = n;
      }
      return !0;
    }
  return !1;
}
function nt(e, t, r, n, i, o, s) {
  e.tag = null, e.dump = r, ja(e, r, !1) || ja(e, r, !0);
  var a = ef.call(e.dump), l = n, f;
  n && (n = e.flowLevel < 0 || e.flowLevel > t);
  var c = a === "[object Object]" || a === "[object Array]", u, h;
  if (c && (u = e.duplicates.indexOf(r), h = u !== -1), (e.tag !== null && e.tag !== "?" || h || e.indent !== 2 && t > 0) && (i = !1), h && e.usedDuplicates[u])
    e.dump = "*ref_" + u;
  else {
    if (c && h && !e.usedDuplicates[u] && (e.usedDuplicates[u] = !0), a === "[object Object]")
      n && Object.keys(e.dump).length !== 0 ? (NE(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (IE(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object Array]")
      n && e.dump.length !== 0 ? (e.noArrayIndent && !s && t > 0 ? Ma(e, t - 1, e.dump, i) : Ma(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (RE(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && CE(e, e.dump, t, o, l);
    else {
      if (a === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new Qr("unacceptable kind of an object to dump " + a);
    }
    e.tag !== null && e.tag !== "?" && (f = encodeURI(
      e.tag[0] === "!" ? e.tag.slice(1) : e.tag
    ).replace(/!/g, "%21"), e.tag[0] === "!" ? f = "!" + f : f.slice(0, 18) === "tag:yaml.org,2002:" ? f = "!!" + f.slice(18) : f = "!<" + f + ">", e.dump = f + " " + e.dump);
  }
  return !0;
}
function PE(e, t) {
  var r = [], n = [], i, o;
  for (qo(e, r, n), i = 0, o = n.length; i < o; i += 1)
    t.duplicates.push(r[n[i]]);
  t.usedDuplicates = new Array(o);
}
function qo(e, t, r) {
  var n, i, o;
  if (e !== null && typeof e == "object")
    if (i = t.indexOf(e), i !== -1)
      r.indexOf(i) === -1 && r.push(i);
    else if (t.push(e), Array.isArray(e))
      for (i = 0, o = e.length; i < o; i += 1)
        qo(e[i], t, r);
    else
      for (n = Object.keys(e), i = 0, o = n.length; i < o; i += 1)
        qo(e[n[i]], t, r);
}
function DE(e, t) {
  t = t || {};
  var r = new _E(t);
  r.noRefs || PE(e, r);
  var n = e;
  return r.replacer && (n = r.replacer.call({ "": n }, "", n)), nt(r, 0, n, !0, !0) ? r.dump + `
` : "";
}
Zu.dump = DE;
var df = fs, FE = Zu;
function Es(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
ve.Type = Ie;
ve.Schema = Tu;
ve.FAILSAFE_SCHEMA = $u;
ve.JSON_SCHEMA = Fu;
ve.CORE_SCHEMA = Lu;
ve.DEFAULT_SCHEMA = hs;
ve.load = df.load;
ve.loadAll = df.loadAll;
ve.dump = FE.dump;
ve.YAMLException = Kr;
ve.types = {
  binary: ju,
  float: Du,
  map: Ou,
  null: Ru,
  pairs: Hu,
  set: qu,
  timestamp: ku,
  bool: Iu,
  int: Nu,
  merge: Mu,
  omap: Bu,
  seq: Cu,
  str: bu
};
ve.safeLoad = Es("safeLoad", "load");
ve.safeLoadAll = Es("safeLoadAll", "loadAll");
ve.safeDump = Es("safeDump", "dump");
var oi = {};
Object.defineProperty(oi, "__esModule", { value: !0 });
oi.Lazy = void 0;
class LE {
  constructor(t) {
    this._value = null, this.creator = t;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null)
      return this._value;
    const t = this.creator();
    return this.value = t, t;
  }
  set value(t) {
    this._value = t, this.creator = null;
  }
}
oi.Lazy = LE;
var Go = { exports: {} };
const xE = "2.0.0", hf = 256, UE = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, kE = 16, ME = hf - 6, jE = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var si = {
  MAX_LENGTH: hf,
  MAX_SAFE_COMPONENT_LENGTH: kE,
  MAX_SAFE_BUILD_LENGTH: ME,
  MAX_SAFE_INTEGER: UE,
  RELEASE_TYPES: jE,
  SEMVER_SPEC_VERSION: xE,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const BE = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var ai = BE;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: i
  } = si, o = ai;
  t = e.exports = {};
  const s = t.re = [], a = t.safeRe = [], l = t.src = [], f = t.safeSrc = [], c = t.t = {};
  let u = 0;
  const h = "[a-zA-Z0-9-]", m = [
    ["\\s", 1],
    ["\\d", i],
    [h, n]
  ], w = (_) => {
    for (const [A, T] of m)
      _ = _.split(`${A}*`).join(`${A}{0,${T}}`).split(`${A}+`).join(`${A}{1,${T}}`);
    return _;
  }, y = (_, A, T) => {
    const P = w(A), L = u++;
    o(_, L, A), c[_] = L, l[L] = A, f[L] = P, s[L] = new RegExp(A, T ? "g" : void 0), a[L] = new RegExp(P, T ? "g" : void 0);
  };
  y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${h}*`), y("MAINVERSION", `(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${l[c.PRERELEASEIDENTIFIER]}(?:\\.${l[c.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${l[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[c.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${h}+`), y("BUILD", `(?:\\+(${l[c.BUILDIDENTIFIER]}(?:\\.${l[c.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${l[c.MAINVERSION]}${l[c.PRERELEASE]}?${l[c.BUILD]}?`), y("FULL", `^${l[c.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${l[c.MAINVERSIONLOOSE]}${l[c.PRERELEASELOOSE]}?${l[c.BUILD]}?`), y("LOOSE", `^${l[c.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${l[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${l[c.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:${l[c.PRERELEASE]})?${l[c.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:${l[c.PRERELEASELOOSE]})?${l[c.BUILD]}?)?)?`), y("XRANGE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), y("COERCE", `${l[c.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", l[c.COERCEPLAIN] + `(?:${l[c.PRERELEASE]})?(?:${l[c.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", l[c.COERCE], !0), y("COERCERTLFULL", l[c.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${l[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", y("TILDE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${l[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", y("CARET", `^${l[c.LONECARET]}${l[c.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${l[c.LONECARET]}${l[c.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${l[c.GTLT]}\\s*(${l[c.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]}|${l[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${l[c.XRANGEPLAIN]})\\s+-\\s+(${l[c.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${l[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[c.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(Go, Go.exports);
var Zr = Go.exports;
const HE = Object.freeze({ loose: !0 }), qE = Object.freeze({}), GE = (e) => e ? typeof e != "object" ? HE : e : qE;
var ys = GE;
const Ba = /^[0-9]+$/, pf = (e, t) => {
  const r = Ba.test(e), n = Ba.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, WE = (e, t) => pf(t, e);
var mf = {
  compareIdentifiers: pf,
  rcompareIdentifiers: WE
};
const _n = ai, { MAX_LENGTH: Ha, MAX_SAFE_INTEGER: Sn } = si, { safeRe: An, t: Tn } = Zr, VE = ys, { compareIdentifiers: Wt } = mf;
let zE = class Je {
  constructor(t, r) {
    if (r = VE(r), t instanceof Je) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > Ha)
      throw new TypeError(
        `version is longer than ${Ha} characters`
      );
    _n("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? An[Tn.LOOSE] : An[Tn.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > Sn || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > Sn || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > Sn || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((i) => {
      if (/^[0-9]+$/.test(i)) {
        const o = +i;
        if (o >= 0 && o < Sn)
          return o;
      }
      return i;
    }) : this.prerelease = [], this.build = n[5] ? n[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (_n("SemVer.compare", this.version, this.options, t), !(t instanceof Je)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Je(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Je || (t = new Je(t, this.options)), Wt(this.major, t.major) || Wt(this.minor, t.minor) || Wt(this.patch, t.patch);
  }
  comparePre(t) {
    if (t instanceof Je || (t = new Je(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], i = t.prerelease[r];
      if (_n("prerelease compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return Wt(n, i);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Je || (t = new Je(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], i = t.build[r];
      if (_n("build compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return Wt(n, i);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const i = `-${r}`.match(this.options.loose ? An[Tn.PRERELEASELOOSE] : An[Tn.PRERELEASE]);
        if (!i || i[1] !== r)
          throw new Error(`invalid identifier: ${r}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, n);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, n);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const i = Number(n) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [i];
        else {
          let o = this.prerelease.length;
          for (; --o >= 0; )
            typeof this.prerelease[o] == "number" && (this.prerelease[o]++, o = -2);
          if (o === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(i);
          }
        }
        if (r) {
          let o = [r, i];
          n === !1 && (o = [r]), Wt(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = o) : this.prerelease = o;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var Ne = zE;
const qa = Ne, YE = (e, t, r = !1) => {
  if (e instanceof qa)
    return e;
  try {
    return new qa(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var fr = YE;
const XE = fr, JE = (e, t) => {
  const r = XE(e, t);
  return r ? r.version : null;
};
var KE = JE;
const QE = fr, ZE = (e, t) => {
  const r = QE(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var ey = ZE;
const Ga = Ne, ty = (e, t, r, n, i) => {
  typeof r == "string" && (i = n, n = r, r = void 0);
  try {
    return new Ga(
      e instanceof Ga ? e.version : e,
      r
    ).inc(t, n, i).version;
  } catch {
    return null;
  }
};
var ry = ty;
const Wa = fr, ny = (e, t) => {
  const r = Wa(e, null, !0), n = Wa(t, null, !0), i = r.compare(n);
  if (i === 0)
    return null;
  const o = i > 0, s = o ? r : n, a = o ? n : r, l = !!s.prerelease.length;
  if (!!a.prerelease.length && !l) {
    if (!a.patch && !a.minor)
      return "major";
    if (a.compareMain(s) === 0)
      return a.minor && !a.patch ? "minor" : "patch";
  }
  const c = l ? "pre" : "";
  return r.major !== n.major ? c + "major" : r.minor !== n.minor ? c + "minor" : r.patch !== n.patch ? c + "patch" : "prerelease";
};
var iy = ny;
const oy = Ne, sy = (e, t) => new oy(e, t).major;
var ay = sy;
const ly = Ne, cy = (e, t) => new ly(e, t).minor;
var uy = cy;
const fy = Ne, dy = (e, t) => new fy(e, t).patch;
var hy = dy;
const py = fr, my = (e, t) => {
  const r = py(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var gy = my;
const Va = Ne, Ey = (e, t, r) => new Va(e, r).compare(new Va(t, r));
var We = Ey;
const yy = We, vy = (e, t, r) => yy(t, e, r);
var wy = vy;
const _y = We, Sy = (e, t) => _y(e, t, !0);
var Ay = Sy;
const za = Ne, Ty = (e, t, r) => {
  const n = new za(e, r), i = new za(t, r);
  return n.compare(i) || n.compareBuild(i);
};
var vs = Ty;
const by = vs, Cy = (e, t) => e.sort((r, n) => by(r, n, t));
var Oy = Cy;
const $y = vs, Ry = (e, t) => e.sort((r, n) => $y(n, r, t));
var Iy = Ry;
const Ny = We, Py = (e, t, r) => Ny(e, t, r) > 0;
var li = Py;
const Dy = We, Fy = (e, t, r) => Dy(e, t, r) < 0;
var ws = Fy;
const Ly = We, xy = (e, t, r) => Ly(e, t, r) === 0;
var gf = xy;
const Uy = We, ky = (e, t, r) => Uy(e, t, r) !== 0;
var Ef = ky;
const My = We, jy = (e, t, r) => My(e, t, r) >= 0;
var _s = jy;
const By = We, Hy = (e, t, r) => By(e, t, r) <= 0;
var Ss = Hy;
const qy = gf, Gy = Ef, Wy = li, Vy = _s, zy = ws, Yy = Ss, Xy = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return qy(e, r, n);
    case "!=":
      return Gy(e, r, n);
    case ">":
      return Wy(e, r, n);
    case ">=":
      return Vy(e, r, n);
    case "<":
      return zy(e, r, n);
    case "<=":
      return Yy(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var yf = Xy;
const Jy = Ne, Ky = fr, { safeRe: bn, t: Cn } = Zr, Qy = (e, t) => {
  if (e instanceof Jy)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? bn[Cn.COERCEFULL] : bn[Cn.COERCE]);
  else {
    const l = t.includePrerelease ? bn[Cn.COERCERTLFULL] : bn[Cn.COERCERTL];
    let f;
    for (; (f = l.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || f.index + f[0].length !== r.index + r[0].length) && (r = f), l.lastIndex = f.index + f[1].length + f[2].length;
    l.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], i = r[3] || "0", o = r[4] || "0", s = t.includePrerelease && r[5] ? `-${r[5]}` : "", a = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return Ky(`${n}.${i}.${o}${s}${a}`, t);
};
var Zy = Qy;
class ev {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const r = this.map.get(t);
    if (r !== void 0)
      return this.map.delete(t), this.map.set(t, r), r;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, r) {
    if (!this.delete(t) && r !== void 0) {
      if (this.map.size >= this.max) {
        const i = this.map.keys().next().value;
        this.delete(i);
      }
      this.map.set(t, r);
    }
    return this;
  }
}
var tv = ev, ji, Ya;
function Ve() {
  if (Ya) return ji;
  Ya = 1;
  const e = /\s+/g;
  class t {
    constructor(O, N) {
      if (N = i(N), O instanceof t)
        return O.loose === !!N.loose && O.includePrerelease === !!N.includePrerelease ? O : new t(O.raw, N);
      if (O instanceof o)
        return this.raw = O.value, this.set = [[O]], this.formatted = void 0, this;
      if (this.options = N, this.loose = !!N.loose, this.includePrerelease = !!N.includePrerelease, this.raw = O.trim().replace(e, " "), this.set = this.raw.split("||").map((C) => this.parseRange(C.trim())).filter((C) => C.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const C = this.set[0];
        if (this.set = this.set.filter((D) => !y(D[0])), this.set.length === 0)
          this.set = [C];
        else if (this.set.length > 1) {
          for (const D of this.set)
            if (D.length === 1 && _(D[0])) {
              this.set = [D];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let O = 0; O < this.set.length; O++) {
          O > 0 && (this.formatted += "||");
          const N = this.set[O];
          for (let C = 0; C < N.length; C++)
            C > 0 && (this.formatted += " "), this.formatted += N[C].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(O) {
      const C = ((this.options.includePrerelease && m) | (this.options.loose && w)) + ":" + O, D = n.get(C);
      if (D)
        return D;
      const I = this.options.loose, k = I ? l[f.HYPHENRANGELOOSE] : l[f.HYPHENRANGE];
      O = O.replace(k, M(this.options.includePrerelease)), s("hyphen replace", O), O = O.replace(l[f.COMPARATORTRIM], c), s("comparator trim", O), O = O.replace(l[f.TILDETRIM], u), s("tilde trim", O), O = O.replace(l[f.CARETTRIM], h), s("caret trim", O);
      let Y = O.split(" ").map((U) => T(U, this.options)).join(" ").split(/\s+/).map((U) => q(U, this.options));
      I && (Y = Y.filter((U) => (s("loose invalid filter", U, this.options), !!U.match(l[f.COMPARATORLOOSE])))), s("range list", Y);
      const G = /* @__PURE__ */ new Map(), Z = Y.map((U) => new o(U, this.options));
      for (const U of Z) {
        if (y(U))
          return [U];
        G.set(U.value, U);
      }
      G.size > 1 && G.has("") && G.delete("");
      const fe = [...G.values()];
      return n.set(C, fe), fe;
    }
    intersects(O, N) {
      if (!(O instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((C) => A(C, N) && O.set.some((D) => A(D, N) && C.every((I) => D.every((k) => I.intersects(k, N)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(O) {
      if (!O)
        return !1;
      if (typeof O == "string")
        try {
          O = new a(O, this.options);
        } catch {
          return !1;
        }
      for (let N = 0; N < this.set.length; N++)
        if (Q(this.set[N], O, this.options))
          return !0;
      return !1;
    }
  }
  ji = t;
  const r = tv, n = new r(), i = ys, o = ci(), s = ai, a = Ne, {
    safeRe: l,
    t: f,
    comparatorTrimReplace: c,
    tildeTrimReplace: u,
    caretTrimReplace: h
  } = Zr, { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: w } = si, y = (R) => R.value === "<0.0.0-0", _ = (R) => R.value === "", A = (R, O) => {
    let N = !0;
    const C = R.slice();
    let D = C.pop();
    for (; N && C.length; )
      N = C.every((I) => D.intersects(I, O)), D = C.pop();
    return N;
  }, T = (R, O) => (s("comp", R, O), R = H(R, O), s("caret", R), R = L(R, O), s("tildes", R), R = ae(R, O), s("xrange", R), R = z(R, O), s("stars", R), R), P = (R) => !R || R.toLowerCase() === "x" || R === "*", L = (R, O) => R.trim().split(/\s+/).map((N) => B(N, O)).join(" "), B = (R, O) => {
    const N = O.loose ? l[f.TILDELOOSE] : l[f.TILDE];
    return R.replace(N, (C, D, I, k, Y) => {
      s("tilde", R, C, D, I, k, Y);
      let G;
      return P(D) ? G = "" : P(I) ? G = `>=${D}.0.0 <${+D + 1}.0.0-0` : P(k) ? G = `>=${D}.${I}.0 <${D}.${+I + 1}.0-0` : Y ? (s("replaceTilde pr", Y), G = `>=${D}.${I}.${k}-${Y} <${D}.${+I + 1}.0-0`) : G = `>=${D}.${I}.${k} <${D}.${+I + 1}.0-0`, s("tilde return", G), G;
    });
  }, H = (R, O) => R.trim().split(/\s+/).map((N) => j(N, O)).join(" "), j = (R, O) => {
    s("caret", R, O);
    const N = O.loose ? l[f.CARETLOOSE] : l[f.CARET], C = O.includePrerelease ? "-0" : "";
    return R.replace(N, (D, I, k, Y, G) => {
      s("caret", R, D, I, k, Y, G);
      let Z;
      return P(I) ? Z = "" : P(k) ? Z = `>=${I}.0.0${C} <${+I + 1}.0.0-0` : P(Y) ? I === "0" ? Z = `>=${I}.${k}.0${C} <${I}.${+k + 1}.0-0` : Z = `>=${I}.${k}.0${C} <${+I + 1}.0.0-0` : G ? (s("replaceCaret pr", G), I === "0" ? k === "0" ? Z = `>=${I}.${k}.${Y}-${G} <${I}.${k}.${+Y + 1}-0` : Z = `>=${I}.${k}.${Y}-${G} <${I}.${+k + 1}.0-0` : Z = `>=${I}.${k}.${Y}-${G} <${+I + 1}.0.0-0`) : (s("no pr"), I === "0" ? k === "0" ? Z = `>=${I}.${k}.${Y}${C} <${I}.${k}.${+Y + 1}-0` : Z = `>=${I}.${k}.${Y}${C} <${I}.${+k + 1}.0-0` : Z = `>=${I}.${k}.${Y} <${+I + 1}.0.0-0`), s("caret return", Z), Z;
    });
  }, ae = (R, O) => (s("replaceXRanges", R, O), R.split(/\s+/).map((N) => E(N, O)).join(" ")), E = (R, O) => {
    R = R.trim();
    const N = O.loose ? l[f.XRANGELOOSE] : l[f.XRANGE];
    return R.replace(N, (C, D, I, k, Y, G) => {
      s("xRange", R, C, D, I, k, Y, G);
      const Z = P(I), fe = Z || P(k), U = fe || P(Y), ze = U;
      return D === "=" && ze && (D = ""), G = O.includePrerelease ? "-0" : "", Z ? D === ">" || D === "<" ? C = "<0.0.0-0" : C = "*" : D && ze ? (fe && (k = 0), Y = 0, D === ">" ? (D = ">=", fe ? (I = +I + 1, k = 0, Y = 0) : (k = +k + 1, Y = 0)) : D === "<=" && (D = "<", fe ? I = +I + 1 : k = +k + 1), D === "<" && (G = "-0"), C = `${D + I}.${k}.${Y}${G}`) : fe ? C = `>=${I}.0.0${G} <${+I + 1}.0.0-0` : U && (C = `>=${I}.${k}.0${G} <${I}.${+k + 1}.0-0`), s("xRange return", C), C;
    });
  }, z = (R, O) => (s("replaceStars", R, O), R.trim().replace(l[f.STAR], "")), q = (R, O) => (s("replaceGTE0", R, O), R.trim().replace(l[O.includePrerelease ? f.GTE0PRE : f.GTE0], "")), M = (R) => (O, N, C, D, I, k, Y, G, Z, fe, U, ze) => (P(C) ? N = "" : P(D) ? N = `>=${C}.0.0${R ? "-0" : ""}` : P(I) ? N = `>=${C}.${D}.0${R ? "-0" : ""}` : k ? N = `>=${N}` : N = `>=${N}${R ? "-0" : ""}`, P(Z) ? G = "" : P(fe) ? G = `<${+Z + 1}.0.0-0` : P(U) ? G = `<${Z}.${+fe + 1}.0-0` : ze ? G = `<=${Z}.${fe}.${U}-${ze}` : R ? G = `<${Z}.${fe}.${+U + 1}-0` : G = `<=${G}`, `${N} ${G}`.trim()), Q = (R, O, N) => {
    for (let C = 0; C < R.length; C++)
      if (!R[C].test(O))
        return !1;
    if (O.prerelease.length && !N.includePrerelease) {
      for (let C = 0; C < R.length; C++)
        if (s(R[C].semver), R[C].semver !== o.ANY && R[C].semver.prerelease.length > 0) {
          const D = R[C].semver;
          if (D.major === O.major && D.minor === O.minor && D.patch === O.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return ji;
}
var Bi, Xa;
function ci() {
  if (Xa) return Bi;
  Xa = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(c, u) {
      if (u = r(u), c instanceof t) {
        if (c.loose === !!u.loose)
          return c;
        c = c.value;
      }
      c = c.trim().split(/\s+/).join(" "), s("comparator", c, u), this.options = u, this.loose = !!u.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, s("comp", this);
    }
    parse(c) {
      const u = this.options.loose ? n[i.COMPARATORLOOSE] : n[i.COMPARATOR], h = c.match(u);
      if (!h)
        throw new TypeError(`Invalid comparator: ${c}`);
      this.operator = h[1] !== void 0 ? h[1] : "", this.operator === "=" && (this.operator = ""), h[2] ? this.semver = new a(h[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(c) {
      if (s("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new a(c, this.options);
        } catch {
          return !1;
        }
      return o(c, this.operator, this.semver, this.options);
    }
    intersects(c, u) {
      if (!(c instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new l(c.value, u).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new l(this.value, u).test(c.semver) : (u = r(u), u.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !u.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || o(this.semver, "<", c.semver, u) && this.operator.startsWith(">") && c.operator.startsWith("<") || o(this.semver, ">", c.semver, u) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  Bi = t;
  const r = ys, { safeRe: n, t: i } = Zr, o = yf, s = ai, a = Ne, l = Ve();
  return Bi;
}
const rv = Ve(), nv = (e, t, r) => {
  try {
    t = new rv(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var ui = nv;
const iv = Ve(), ov = (e, t) => new iv(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var sv = ov;
const av = Ne, lv = Ve(), cv = (e, t, r) => {
  let n = null, i = null, o = null;
  try {
    o = new lv(t, r);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!n || i.compare(s) === -1) && (n = s, i = new av(n, r));
  }), n;
};
var uv = cv;
const fv = Ne, dv = Ve(), hv = (e, t, r) => {
  let n = null, i = null, o = null;
  try {
    o = new dv(t, r);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!n || i.compare(s) === 1) && (n = s, i = new fv(n, r));
  }), n;
};
var pv = hv;
const Hi = Ne, mv = Ve(), Ja = li, gv = (e, t) => {
  e = new mv(e, t);
  let r = new Hi("0.0.0");
  if (e.test(r) || (r = new Hi("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const i = e.set[n];
    let o = null;
    i.forEach((s) => {
      const a = new Hi(s.semver.version);
      switch (s.operator) {
        case ">":
          a.prerelease.length === 0 ? a.patch++ : a.prerelease.push(0), a.raw = a.format();
        case "":
        case ">=":
          (!o || Ja(a, o)) && (o = a);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${s.operator}`);
      }
    }), o && (!r || Ja(r, o)) && (r = o);
  }
  return r && e.test(r) ? r : null;
};
var Ev = gv;
const yv = Ve(), vv = (e, t) => {
  try {
    return new yv(e, t).range || "*";
  } catch {
    return null;
  }
};
var wv = vv;
const _v = Ne, vf = ci(), { ANY: Sv } = vf, Av = Ve(), Tv = ui, Ka = li, Qa = ws, bv = Ss, Cv = _s, Ov = (e, t, r, n) => {
  e = new _v(e, n), t = new Av(t, n);
  let i, o, s, a, l;
  switch (r) {
    case ">":
      i = Ka, o = bv, s = Qa, a = ">", l = ">=";
      break;
    case "<":
      i = Qa, o = Cv, s = Ka, a = "<", l = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (Tv(e, t, n))
    return !1;
  for (let f = 0; f < t.set.length; ++f) {
    const c = t.set[f];
    let u = null, h = null;
    if (c.forEach((m) => {
      m.semver === Sv && (m = new vf(">=0.0.0")), u = u || m, h = h || m, i(m.semver, u.semver, n) ? u = m : s(m.semver, h.semver, n) && (h = m);
    }), u.operator === a || u.operator === l || (!h.operator || h.operator === a) && o(e, h.semver))
      return !1;
    if (h.operator === l && s(e, h.semver))
      return !1;
  }
  return !0;
};
var As = Ov;
const $v = As, Rv = (e, t, r) => $v(e, t, ">", r);
var Iv = Rv;
const Nv = As, Pv = (e, t, r) => Nv(e, t, "<", r);
var Dv = Pv;
const Za = Ve(), Fv = (e, t, r) => (e = new Za(e, r), t = new Za(t, r), e.intersects(t, r));
var Lv = Fv;
const xv = ui, Uv = We;
var kv = (e, t, r) => {
  const n = [];
  let i = null, o = null;
  const s = e.sort((c, u) => Uv(c, u, r));
  for (const c of s)
    xv(c, t, r) ? (o = c, i || (i = c)) : (o && n.push([i, o]), o = null, i = null);
  i && n.push([i, null]);
  const a = [];
  for (const [c, u] of n)
    c === u ? a.push(c) : !u && c === s[0] ? a.push("*") : u ? c === s[0] ? a.push(`<=${u}`) : a.push(`${c} - ${u}`) : a.push(`>=${c}`);
  const l = a.join(" || "), f = typeof t.raw == "string" ? t.raw : String(t);
  return l.length < f.length ? l : t;
};
const el = Ve(), Ts = ci(), { ANY: qi } = Ts, wr = ui, bs = We, Mv = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new el(e, r), t = new el(t, r);
  let n = !1;
  e: for (const i of e.set) {
    for (const o of t.set) {
      const s = Bv(i, o, r);
      if (n = n || s !== null, s)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, jv = [new Ts(">=0.0.0-0")], tl = [new Ts(">=0.0.0")], Bv = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === qi) {
    if (t.length === 1 && t[0].semver === qi)
      return !0;
    r.includePrerelease ? e = jv : e = tl;
  }
  if (t.length === 1 && t[0].semver === qi) {
    if (r.includePrerelease)
      return !0;
    t = tl;
  }
  const n = /* @__PURE__ */ new Set();
  let i, o;
  for (const m of e)
    m.operator === ">" || m.operator === ">=" ? i = rl(i, m, r) : m.operator === "<" || m.operator === "<=" ? o = nl(o, m, r) : n.add(m.semver);
  if (n.size > 1)
    return null;
  let s;
  if (i && o) {
    if (s = bs(i.semver, o.semver, r), s > 0)
      return null;
    if (s === 0 && (i.operator !== ">=" || o.operator !== "<="))
      return null;
  }
  for (const m of n) {
    if (i && !wr(m, String(i), r) || o && !wr(m, String(o), r))
      return null;
    for (const w of t)
      if (!wr(m, String(w), r))
        return !1;
    return !0;
  }
  let a, l, f, c, u = o && !r.includePrerelease && o.semver.prerelease.length ? o.semver : !1, h = i && !r.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  u && u.prerelease.length === 1 && o.operator === "<" && u.prerelease[0] === 0 && (u = !1);
  for (const m of t) {
    if (c = c || m.operator === ">" || m.operator === ">=", f = f || m.operator === "<" || m.operator === "<=", i) {
      if (h && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === h.major && m.semver.minor === h.minor && m.semver.patch === h.patch && (h = !1), m.operator === ">" || m.operator === ">=") {
        if (a = rl(i, m, r), a === m && a !== i)
          return !1;
      } else if (i.operator === ">=" && !wr(i.semver, String(m), r))
        return !1;
    }
    if (o) {
      if (u && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === u.major && m.semver.minor === u.minor && m.semver.patch === u.patch && (u = !1), m.operator === "<" || m.operator === "<=") {
        if (l = nl(o, m, r), l === m && l !== o)
          return !1;
      } else if (o.operator === "<=" && !wr(o.semver, String(m), r))
        return !1;
    }
    if (!m.operator && (o || i) && s !== 0)
      return !1;
  }
  return !(i && f && !o && s !== 0 || o && c && !i && s !== 0 || h || u);
}, rl = (e, t, r) => {
  if (!e)
    return t;
  const n = bs(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, nl = (e, t, r) => {
  if (!e)
    return t;
  const n = bs(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var Hv = Mv;
const Gi = Zr, il = si, qv = Ne, ol = mf, Gv = fr, Wv = KE, Vv = ey, zv = ry, Yv = iy, Xv = ay, Jv = uy, Kv = hy, Qv = gy, Zv = We, ew = wy, tw = Ay, rw = vs, nw = Oy, iw = Iy, ow = li, sw = ws, aw = gf, lw = Ef, cw = _s, uw = Ss, fw = yf, dw = Zy, hw = ci(), pw = Ve(), mw = ui, gw = sv, Ew = uv, yw = pv, vw = Ev, ww = wv, _w = As, Sw = Iv, Aw = Dv, Tw = Lv, bw = kv, Cw = Hv;
var wf = {
  parse: Gv,
  valid: Wv,
  clean: Vv,
  inc: zv,
  diff: Yv,
  major: Xv,
  minor: Jv,
  patch: Kv,
  prerelease: Qv,
  compare: Zv,
  rcompare: ew,
  compareLoose: tw,
  compareBuild: rw,
  sort: nw,
  rsort: iw,
  gt: ow,
  lt: sw,
  eq: aw,
  neq: lw,
  gte: cw,
  lte: uw,
  cmp: fw,
  coerce: dw,
  Comparator: hw,
  Range: pw,
  satisfies: mw,
  toComparators: gw,
  maxSatisfying: Ew,
  minSatisfying: yw,
  minVersion: vw,
  validRange: ww,
  outside: _w,
  gtr: Sw,
  ltr: Aw,
  intersects: Tw,
  simplifyRange: bw,
  subset: Cw,
  SemVer: qv,
  re: Gi.re,
  src: Gi.src,
  tokens: Gi.t,
  SEMVER_SPEC_VERSION: il.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: il.RELEASE_TYPES,
  compareIdentifiers: ol.compareIdentifiers,
  rcompareIdentifiers: ol.rcompareIdentifiers
}, en = {}, Yn = { exports: {} };
Yn.exports;
(function(e, t) {
  var r = 200, n = "__lodash_hash_undefined__", i = 1, o = 2, s = 9007199254740991, a = "[object Arguments]", l = "[object Array]", f = "[object AsyncFunction]", c = "[object Boolean]", u = "[object Date]", h = "[object Error]", m = "[object Function]", w = "[object GeneratorFunction]", y = "[object Map]", _ = "[object Number]", A = "[object Null]", T = "[object Object]", P = "[object Promise]", L = "[object Proxy]", B = "[object RegExp]", H = "[object Set]", j = "[object String]", ae = "[object Symbol]", E = "[object Undefined]", z = "[object WeakMap]", q = "[object ArrayBuffer]", M = "[object DataView]", Q = "[object Float32Array]", R = "[object Float64Array]", O = "[object Int8Array]", N = "[object Int16Array]", C = "[object Int32Array]", D = "[object Uint8Array]", I = "[object Uint8ClampedArray]", k = "[object Uint16Array]", Y = "[object Uint32Array]", G = /[\\^$.*+?()[\]{}|]/g, Z = /^\[object .+?Constructor\]$/, fe = /^(?:0|[1-9]\d*)$/, U = {};
  U[Q] = U[R] = U[O] = U[N] = U[C] = U[D] = U[I] = U[k] = U[Y] = !0, U[a] = U[l] = U[q] = U[c] = U[M] = U[u] = U[h] = U[m] = U[y] = U[_] = U[T] = U[B] = U[H] = U[j] = U[z] = !1;
  var ze = typeof be == "object" && be && be.Object === Object && be, p = typeof self == "object" && self && self.Object === Object && self, d = ze || p || Function("return this")(), b = t && !t.nodeType && t, S = b && !0 && e && !e.nodeType && e, J = S && S.exports === b, re = J && ze.process, oe = function() {
    try {
      return re && re.binding && re.binding("util");
    } catch {
    }
  }(), me = oe && oe.isTypedArray;
  function we(g, v) {
    for (var $ = -1, F = g == null ? 0 : g.length, te = 0, W = []; ++$ < F; ) {
      var se = g[$];
      v(se, $, g) && (W[te++] = se);
    }
    return W;
  }
  function ot(g, v) {
    for (var $ = -1, F = v.length, te = g.length; ++$ < F; )
      g[te + $] = v[$];
    return g;
  }
  function ce(g, v) {
    for (var $ = -1, F = g == null ? 0 : g.length; ++$ < F; )
      if (v(g[$], $, g))
        return !0;
    return !1;
  }
  function je(g, v) {
    for (var $ = -1, F = Array(g); ++$ < g; )
      F[$] = v($);
    return F;
  }
  function wi(g) {
    return function(v) {
      return g(v);
    };
  }
  function on(g, v) {
    return g.has(v);
  }
  function hr(g, v) {
    return g == null ? void 0 : g[v];
  }
  function sn(g) {
    var v = -1, $ = Array(g.size);
    return g.forEach(function(F, te) {
      $[++v] = [te, F];
    }), $;
  }
  function Mf(g, v) {
    return function($) {
      return g(v($));
    };
  }
  function jf(g) {
    var v = -1, $ = Array(g.size);
    return g.forEach(function(F) {
      $[++v] = F;
    }), $;
  }
  var Bf = Array.prototype, Hf = Function.prototype, an = Object.prototype, _i = d["__core-js_shared__"], Is = Hf.toString, Ye = an.hasOwnProperty, Ns = function() {
    var g = /[^.]+$/.exec(_i && _i.keys && _i.keys.IE_PROTO || "");
    return g ? "Symbol(src)_1." + g : "";
  }(), Ps = an.toString, qf = RegExp(
    "^" + Is.call(Ye).replace(G, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), Ds = J ? d.Buffer : void 0, ln = d.Symbol, Fs = d.Uint8Array, Ls = an.propertyIsEnumerable, Gf = Bf.splice, bt = ln ? ln.toStringTag : void 0, xs = Object.getOwnPropertySymbols, Wf = Ds ? Ds.isBuffer : void 0, Vf = Mf(Object.keys, Object), Si = Ht(d, "DataView"), pr = Ht(d, "Map"), Ai = Ht(d, "Promise"), Ti = Ht(d, "Set"), bi = Ht(d, "WeakMap"), mr = Ht(Object, "create"), zf = $t(Si), Yf = $t(pr), Xf = $t(Ai), Jf = $t(Ti), Kf = $t(bi), Us = ln ? ln.prototype : void 0, Ci = Us ? Us.valueOf : void 0;
  function Ct(g) {
    var v = -1, $ = g == null ? 0 : g.length;
    for (this.clear(); ++v < $; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function Qf() {
    this.__data__ = mr ? mr(null) : {}, this.size = 0;
  }
  function Zf(g) {
    var v = this.has(g) && delete this.__data__[g];
    return this.size -= v ? 1 : 0, v;
  }
  function ed(g) {
    var v = this.__data__;
    if (mr) {
      var $ = v[g];
      return $ === n ? void 0 : $;
    }
    return Ye.call(v, g) ? v[g] : void 0;
  }
  function td(g) {
    var v = this.__data__;
    return mr ? v[g] !== void 0 : Ye.call(v, g);
  }
  function rd(g, v) {
    var $ = this.__data__;
    return this.size += this.has(g) ? 0 : 1, $[g] = mr && v === void 0 ? n : v, this;
  }
  Ct.prototype.clear = Qf, Ct.prototype.delete = Zf, Ct.prototype.get = ed, Ct.prototype.has = td, Ct.prototype.set = rd;
  function et(g) {
    var v = -1, $ = g == null ? 0 : g.length;
    for (this.clear(); ++v < $; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function nd() {
    this.__data__ = [], this.size = 0;
  }
  function id(g) {
    var v = this.__data__, $ = un(v, g);
    if ($ < 0)
      return !1;
    var F = v.length - 1;
    return $ == F ? v.pop() : Gf.call(v, $, 1), --this.size, !0;
  }
  function od(g) {
    var v = this.__data__, $ = un(v, g);
    return $ < 0 ? void 0 : v[$][1];
  }
  function sd(g) {
    return un(this.__data__, g) > -1;
  }
  function ad(g, v) {
    var $ = this.__data__, F = un($, g);
    return F < 0 ? (++this.size, $.push([g, v])) : $[F][1] = v, this;
  }
  et.prototype.clear = nd, et.prototype.delete = id, et.prototype.get = od, et.prototype.has = sd, et.prototype.set = ad;
  function Ot(g) {
    var v = -1, $ = g == null ? 0 : g.length;
    for (this.clear(); ++v < $; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function ld() {
    this.size = 0, this.__data__ = {
      hash: new Ct(),
      map: new (pr || et)(),
      string: new Ct()
    };
  }
  function cd(g) {
    var v = fn(this, g).delete(g);
    return this.size -= v ? 1 : 0, v;
  }
  function ud(g) {
    return fn(this, g).get(g);
  }
  function fd(g) {
    return fn(this, g).has(g);
  }
  function dd(g, v) {
    var $ = fn(this, g), F = $.size;
    return $.set(g, v), this.size += $.size == F ? 0 : 1, this;
  }
  Ot.prototype.clear = ld, Ot.prototype.delete = cd, Ot.prototype.get = ud, Ot.prototype.has = fd, Ot.prototype.set = dd;
  function cn(g) {
    var v = -1, $ = g == null ? 0 : g.length;
    for (this.__data__ = new Ot(); ++v < $; )
      this.add(g[v]);
  }
  function hd(g) {
    return this.__data__.set(g, n), this;
  }
  function pd(g) {
    return this.__data__.has(g);
  }
  cn.prototype.add = cn.prototype.push = hd, cn.prototype.has = pd;
  function st(g) {
    var v = this.__data__ = new et(g);
    this.size = v.size;
  }
  function md() {
    this.__data__ = new et(), this.size = 0;
  }
  function gd(g) {
    var v = this.__data__, $ = v.delete(g);
    return this.size = v.size, $;
  }
  function Ed(g) {
    return this.__data__.get(g);
  }
  function yd(g) {
    return this.__data__.has(g);
  }
  function vd(g, v) {
    var $ = this.__data__;
    if ($ instanceof et) {
      var F = $.__data__;
      if (!pr || F.length < r - 1)
        return F.push([g, v]), this.size = ++$.size, this;
      $ = this.__data__ = new Ot(F);
    }
    return $.set(g, v), this.size = $.size, this;
  }
  st.prototype.clear = md, st.prototype.delete = gd, st.prototype.get = Ed, st.prototype.has = yd, st.prototype.set = vd;
  function wd(g, v) {
    var $ = dn(g), F = !$ && Ld(g), te = !$ && !F && Oi(g), W = !$ && !F && !te && Vs(g), se = $ || F || te || W, de = se ? je(g.length, String) : [], ge = de.length;
    for (var ne in g)
      Ye.call(g, ne) && !(se && // Safari 9 has enumerable `arguments.length` in strict mode.
      (ne == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      te && (ne == "offset" || ne == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      W && (ne == "buffer" || ne == "byteLength" || ne == "byteOffset") || // Skip index properties.
      Id(ne, ge))) && de.push(ne);
    return de;
  }
  function un(g, v) {
    for (var $ = g.length; $--; )
      if (Hs(g[$][0], v))
        return $;
    return -1;
  }
  function _d(g, v, $) {
    var F = v(g);
    return dn(g) ? F : ot(F, $(g));
  }
  function gr(g) {
    return g == null ? g === void 0 ? E : A : bt && bt in Object(g) ? $d(g) : Fd(g);
  }
  function ks(g) {
    return Er(g) && gr(g) == a;
  }
  function Ms(g, v, $, F, te) {
    return g === v ? !0 : g == null || v == null || !Er(g) && !Er(v) ? g !== g && v !== v : Sd(g, v, $, F, Ms, te);
  }
  function Sd(g, v, $, F, te, W) {
    var se = dn(g), de = dn(v), ge = se ? l : at(g), ne = de ? l : at(v);
    ge = ge == a ? T : ge, ne = ne == a ? T : ne;
    var xe = ge == T, Be = ne == T, _e = ge == ne;
    if (_e && Oi(g)) {
      if (!Oi(v))
        return !1;
      se = !0, xe = !1;
    }
    if (_e && !xe)
      return W || (W = new st()), se || Vs(g) ? js(g, v, $, F, te, W) : Cd(g, v, ge, $, F, te, W);
    if (!($ & i)) {
      var Ue = xe && Ye.call(g, "__wrapped__"), ke = Be && Ye.call(v, "__wrapped__");
      if (Ue || ke) {
        var lt = Ue ? g.value() : g, tt = ke ? v.value() : v;
        return W || (W = new st()), te(lt, tt, $, F, W);
      }
    }
    return _e ? (W || (W = new st()), Od(g, v, $, F, te, W)) : !1;
  }
  function Ad(g) {
    if (!Ws(g) || Pd(g))
      return !1;
    var v = qs(g) ? qf : Z;
    return v.test($t(g));
  }
  function Td(g) {
    return Er(g) && Gs(g.length) && !!U[gr(g)];
  }
  function bd(g) {
    if (!Dd(g))
      return Vf(g);
    var v = [];
    for (var $ in Object(g))
      Ye.call(g, $) && $ != "constructor" && v.push($);
    return v;
  }
  function js(g, v, $, F, te, W) {
    var se = $ & i, de = g.length, ge = v.length;
    if (de != ge && !(se && ge > de))
      return !1;
    var ne = W.get(g);
    if (ne && W.get(v))
      return ne == v;
    var xe = -1, Be = !0, _e = $ & o ? new cn() : void 0;
    for (W.set(g, v), W.set(v, g); ++xe < de; ) {
      var Ue = g[xe], ke = v[xe];
      if (F)
        var lt = se ? F(ke, Ue, xe, v, g, W) : F(Ue, ke, xe, g, v, W);
      if (lt !== void 0) {
        if (lt)
          continue;
        Be = !1;
        break;
      }
      if (_e) {
        if (!ce(v, function(tt, Rt) {
          if (!on(_e, Rt) && (Ue === tt || te(Ue, tt, $, F, W)))
            return _e.push(Rt);
        })) {
          Be = !1;
          break;
        }
      } else if (!(Ue === ke || te(Ue, ke, $, F, W))) {
        Be = !1;
        break;
      }
    }
    return W.delete(g), W.delete(v), Be;
  }
  function Cd(g, v, $, F, te, W, se) {
    switch ($) {
      case M:
        if (g.byteLength != v.byteLength || g.byteOffset != v.byteOffset)
          return !1;
        g = g.buffer, v = v.buffer;
      case q:
        return !(g.byteLength != v.byteLength || !W(new Fs(g), new Fs(v)));
      case c:
      case u:
      case _:
        return Hs(+g, +v);
      case h:
        return g.name == v.name && g.message == v.message;
      case B:
      case j:
        return g == v + "";
      case y:
        var de = sn;
      case H:
        var ge = F & i;
        if (de || (de = jf), g.size != v.size && !ge)
          return !1;
        var ne = se.get(g);
        if (ne)
          return ne == v;
        F |= o, se.set(g, v);
        var xe = js(de(g), de(v), F, te, W, se);
        return se.delete(g), xe;
      case ae:
        if (Ci)
          return Ci.call(g) == Ci.call(v);
    }
    return !1;
  }
  function Od(g, v, $, F, te, W) {
    var se = $ & i, de = Bs(g), ge = de.length, ne = Bs(v), xe = ne.length;
    if (ge != xe && !se)
      return !1;
    for (var Be = ge; Be--; ) {
      var _e = de[Be];
      if (!(se ? _e in v : Ye.call(v, _e)))
        return !1;
    }
    var Ue = W.get(g);
    if (Ue && W.get(v))
      return Ue == v;
    var ke = !0;
    W.set(g, v), W.set(v, g);
    for (var lt = se; ++Be < ge; ) {
      _e = de[Be];
      var tt = g[_e], Rt = v[_e];
      if (F)
        var zs = se ? F(Rt, tt, _e, v, g, W) : F(tt, Rt, _e, g, v, W);
      if (!(zs === void 0 ? tt === Rt || te(tt, Rt, $, F, W) : zs)) {
        ke = !1;
        break;
      }
      lt || (lt = _e == "constructor");
    }
    if (ke && !lt) {
      var hn = g.constructor, pn = v.constructor;
      hn != pn && "constructor" in g && "constructor" in v && !(typeof hn == "function" && hn instanceof hn && typeof pn == "function" && pn instanceof pn) && (ke = !1);
    }
    return W.delete(g), W.delete(v), ke;
  }
  function Bs(g) {
    return _d(g, kd, Rd);
  }
  function fn(g, v) {
    var $ = g.__data__;
    return Nd(v) ? $[typeof v == "string" ? "string" : "hash"] : $.map;
  }
  function Ht(g, v) {
    var $ = hr(g, v);
    return Ad($) ? $ : void 0;
  }
  function $d(g) {
    var v = Ye.call(g, bt), $ = g[bt];
    try {
      g[bt] = void 0;
      var F = !0;
    } catch {
    }
    var te = Ps.call(g);
    return F && (v ? g[bt] = $ : delete g[bt]), te;
  }
  var Rd = xs ? function(g) {
    return g == null ? [] : (g = Object(g), we(xs(g), function(v) {
      return Ls.call(g, v);
    }));
  } : Md, at = gr;
  (Si && at(new Si(new ArrayBuffer(1))) != M || pr && at(new pr()) != y || Ai && at(Ai.resolve()) != P || Ti && at(new Ti()) != H || bi && at(new bi()) != z) && (at = function(g) {
    var v = gr(g), $ = v == T ? g.constructor : void 0, F = $ ? $t($) : "";
    if (F)
      switch (F) {
        case zf:
          return M;
        case Yf:
          return y;
        case Xf:
          return P;
        case Jf:
          return H;
        case Kf:
          return z;
      }
    return v;
  });
  function Id(g, v) {
    return v = v ?? s, !!v && (typeof g == "number" || fe.test(g)) && g > -1 && g % 1 == 0 && g < v;
  }
  function Nd(g) {
    var v = typeof g;
    return v == "string" || v == "number" || v == "symbol" || v == "boolean" ? g !== "__proto__" : g === null;
  }
  function Pd(g) {
    return !!Ns && Ns in g;
  }
  function Dd(g) {
    var v = g && g.constructor, $ = typeof v == "function" && v.prototype || an;
    return g === $;
  }
  function Fd(g) {
    return Ps.call(g);
  }
  function $t(g) {
    if (g != null) {
      try {
        return Is.call(g);
      } catch {
      }
      try {
        return g + "";
      } catch {
      }
    }
    return "";
  }
  function Hs(g, v) {
    return g === v || g !== g && v !== v;
  }
  var Ld = ks(/* @__PURE__ */ function() {
    return arguments;
  }()) ? ks : function(g) {
    return Er(g) && Ye.call(g, "callee") && !Ls.call(g, "callee");
  }, dn = Array.isArray;
  function xd(g) {
    return g != null && Gs(g.length) && !qs(g);
  }
  var Oi = Wf || jd;
  function Ud(g, v) {
    return Ms(g, v);
  }
  function qs(g) {
    if (!Ws(g))
      return !1;
    var v = gr(g);
    return v == m || v == w || v == f || v == L;
  }
  function Gs(g) {
    return typeof g == "number" && g > -1 && g % 1 == 0 && g <= s;
  }
  function Ws(g) {
    var v = typeof g;
    return g != null && (v == "object" || v == "function");
  }
  function Er(g) {
    return g != null && typeof g == "object";
  }
  var Vs = me ? wi(me) : Td;
  function kd(g) {
    return xd(g) ? wd(g) : bd(g);
  }
  function Md() {
    return [];
  }
  function jd() {
    return !1;
  }
  e.exports = Ud;
})(Yn, Yn.exports);
var Ow = Yn.exports;
Object.defineProperty(en, "__esModule", { value: !0 });
en.DownloadedUpdateHelper = void 0;
en.createTempUpdateFile = Pw;
const $w = zr, Rw = Le, sl = Ow, Nt = At, $r = K;
class Iw {
  constructor(t) {
    this.cacheDir = t, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return $r.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, r, n, i) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return sl(this.versionInfo, r) && sl(this.fileInfo.info, n.info) && await (0, Nt.pathExists)(t) ? t : null;
    const o = await this.getValidCachedUpdateFile(n, i);
    return o === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = o, o);
  }
  async setDownloadedFile(t, r, n, i, o, s) {
    this._file = t, this._packageFile = r, this.versionInfo = n, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: o,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, s && await (0, Nt.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, Nt.emptyDir)(this.cacheDirForPendingUpdate);
    } catch {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(t, r) {
    const n = this.getUpdateInfoFile();
    if (!await (0, Nt.pathExists)(n))
      return null;
    let o;
    try {
      o = await (0, Nt.readJson)(n);
    } catch (f) {
      let c = "No cached update info available";
      return f.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), c += ` (error on read: ${f.message})`), r.info(c), null;
    }
    if (!((o == null ? void 0 : o.fileName) !== null))
      return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== o.sha512)
      return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${o.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const a = $r.join(this.cacheDirForPendingUpdate, o.fileName);
    if (!await (0, Nt.pathExists)(a))
      return r.info("Cached update file doesn't exist"), null;
    const l = await Nw(a);
    return t.info.sha512 !== l ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${l}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = o, a);
  }
  getUpdateInfoFile() {
    return $r.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
en.DownloadedUpdateHelper = Iw;
function Nw(e, t = "sha512", r = "base64", n) {
  return new Promise((i, o) => {
    const s = (0, $w.createHash)(t);
    s.on("error", o).setEncoding(r), (0, Rw.createReadStream)(e, {
      ...n,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", o).on("end", () => {
      s.end(), i(s.read());
    }).pipe(s, { end: !1 });
  });
}
async function Pw(e, t, r) {
  let n = 0, i = $r.join(t, e);
  for (let o = 0; o < 3; o++)
    try {
      return await (0, Nt.unlink)(i), i;
    } catch (s) {
      if (s.code === "ENOENT")
        return i;
      r.warn(`Error on remove temp update file: ${s}`), i = $r.join(t, `${n++}-${e}`);
    }
  return i;
}
var fi = {}, Cs = {};
Object.defineProperty(Cs, "__esModule", { value: !0 });
Cs.getAppCacheDir = Fw;
const Wi = K, Dw = St;
function Fw() {
  const e = (0, Dw.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || Wi.join(e, "AppData", "Local") : process.platform === "darwin" ? t = Wi.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || Wi.join(e, ".cache"), t;
}
Object.defineProperty(fi, "__esModule", { value: !0 });
fi.ElectronAppAdapter = void 0;
const al = K, Lw = Cs;
class xw {
  constructor(t = gt.app) {
    this.app = t;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === !0;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? al.join(process.resourcesPath, "app-update.yml") : al.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, Lw.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(t) {
    this.app.once("quit", (r, n) => t(n));
  }
}
fi.ElectronAppAdapter = xw;
var _f = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
  const t = pe;
  e.NET_SESSION_NAME = "electron-updater";
  function r() {
    return gt.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class n extends t.HttpExecutor {
    constructor(o) {
      super(), this.proxyLoginCallback = o, this.cachedSession = null;
    }
    async download(o, s, a) {
      return await a.cancellationToken.createPromise((l, f, c) => {
        const u = {
          headers: a.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(o, u), (0, t.configureRequestOptions)(u), this.doDownload(u, {
          destination: s,
          options: a,
          onCancel: c,
          callback: (h) => {
            h == null ? l(s) : f(h);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(o, s) {
      o.headers && o.headers.Host && (o.host = o.headers.Host, delete o.headers.Host), this.cachedSession == null && (this.cachedSession = r());
      const a = gt.net.request({
        ...o,
        session: this.cachedSession
      });
      return a.on("response", s), this.proxyLoginCallback != null && a.on("login", this.proxyLoginCallback), a;
    }
    addRedirectHandlers(o, s, a, l, f) {
      o.on("redirect", (c, u, h) => {
        o.abort(), l > this.maxRedirects ? a(this.createMaxRedirectError()) : f(t.HttpExecutor.prepareRedirectUrlOptions(h, s));
      });
    }
  }
  e.ElectronHttpExecutor = n;
})(_f);
var tn = {}, Me = {}, Uw = "[object Symbol]", Sf = /[\\^$.*+?()[\]{}|]/g, kw = RegExp(Sf.source), Mw = typeof be == "object" && be && be.Object === Object && be, jw = typeof self == "object" && self && self.Object === Object && self, Bw = Mw || jw || Function("return this")(), Hw = Object.prototype, qw = Hw.toString, ll = Bw.Symbol, cl = ll ? ll.prototype : void 0, ul = cl ? cl.toString : void 0;
function Gw(e) {
  if (typeof e == "string")
    return e;
  if (Vw(e))
    return ul ? ul.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function Ww(e) {
  return !!e && typeof e == "object";
}
function Vw(e) {
  return typeof e == "symbol" || Ww(e) && qw.call(e) == Uw;
}
function zw(e) {
  return e == null ? "" : Gw(e);
}
function Yw(e) {
  return e = zw(e), e && kw.test(e) ? e.replace(Sf, "\\$&") : e;
}
var Xw = Yw;
Object.defineProperty(Me, "__esModule", { value: !0 });
Me.newBaseUrl = Kw;
Me.newUrlFromBase = Wo;
Me.getChannelFilename = Qw;
Me.blockmapFiles = Zw;
const Af = lr, Jw = Xw;
function Kw(e) {
  const t = new Af.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function Wo(e, t, r = !1) {
  const n = new Af.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? n.search = i : r && (n.search = `noCache=${Date.now().toString(32)}`), n;
}
function Qw(e) {
  return `${e}.yml`;
}
function Zw(e, t, r) {
  const n = Wo(`${e.pathname}.blockmap`, e);
  return [Wo(`${e.pathname.replace(new RegExp(Jw(r), "g"), t)}.blockmap`, e), n];
}
var ue = {};
Object.defineProperty(ue, "__esModule", { value: !0 });
ue.Provider = void 0;
ue.findFile = r_;
ue.parseUpdateInfo = n_;
ue.getFileList = Tf;
ue.resolveFiles = i_;
const wt = pe, e_ = ve, fl = Me;
class t_ {
  constructor(t) {
    this.runtimeOptions = t, this.requestHeaders = null, this.executor = t.executor;
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const t = process.env.TEST_UPDATER_ARCH || process.arch;
      return "-linux" + (t === "x64" ? "" : `-${t}`);
    } else
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(t) {
    return `${t}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(t) {
    this.requestHeaders = t;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(t, r, n) {
    return this.executor.request(this.createRequestOptions(t, r), n);
  }
  createRequestOptions(t, r) {
    const n = {};
    return this.requestHeaders == null ? r != null && (n.headers = r) : n.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, wt.configureRequestUrl)(t, n), n;
  }
}
ue.Provider = t_;
function r_(e, t, r) {
  if (e.length === 0)
    throw (0, wt.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const n = e.find((i) => i.url.pathname.toLowerCase().endsWith(`.${t}`));
  return n ?? (r == null ? e[0] : e.find((i) => !r.some((o) => i.url.pathname.toLowerCase().endsWith(`.${o}`))));
}
function n_(e, t, r) {
  if (e == null)
    throw (0, wt.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let n;
  try {
    n = (0, e_.load)(e);
  } catch (i) {
    throw (0, wt.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return n;
}
function Tf(e) {
  const t = e.files;
  if (t != null && t.length > 0)
    return t;
  if (e.path != null)
    return [
      {
        url: e.path,
        sha2: e.sha2,
        sha512: e.sha512
      }
    ];
  throw (0, wt.newError)(`No files provided: ${(0, wt.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function i_(e, t, r = (n) => n) {
  const i = Tf(e).map((a) => {
    if (a.sha2 == null && a.sha512 == null)
      throw (0, wt.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, wt.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, fl.newUrlFromBase)(r(a.url), t),
      info: a
    };
  }), o = e.packages, s = o == null ? null : o[process.arch] || o.ia32;
  return s != null && (i[0].packageInfo = {
    ...s,
    path: (0, fl.newUrlFromBase)(r(s.path), t).href
  }), i;
}
Object.defineProperty(tn, "__esModule", { value: !0 });
tn.GenericProvider = void 0;
const dl = pe, Vi = Me, zi = ue;
class o_ extends zi.Provider {
  constructor(t, r, n) {
    super(n), this.configuration = t, this.updater = r, this.baseUrl = (0, Vi.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, Vi.getChannelFilename)(this.channel), r = (0, Vi.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let n = 0; ; n++)
      try {
        return (0, zi.parseUpdateInfo)(await this.httpRequest(r), t, r);
      } catch (i) {
        if (i instanceof dl.HttpError && i.statusCode === 404)
          throw (0, dl.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (i.code === "ECONNREFUSED" && n < 3) {
          await new Promise((o, s) => {
            try {
              setTimeout(o, 1e3 * n);
            } catch (a) {
              s(a);
            }
          });
          continue;
        }
        throw i;
      }
  }
  resolveFiles(t) {
    return (0, zi.resolveFiles)(t, this.baseUrl);
  }
}
tn.GenericProvider = o_;
var di = {}, hi = {};
Object.defineProperty(hi, "__esModule", { value: !0 });
hi.BitbucketProvider = void 0;
const hl = pe, Yi = Me, Xi = ue;
class s_ extends Xi.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r;
    const { owner: i, slug: o } = t;
    this.baseUrl = (0, Yi.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${o}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new hl.CancellationToken(), r = (0, Yi.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, Yi.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, void 0, t);
      return (0, Xi.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, hl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Xi.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: r } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${r}, channel: ${this.channel})`;
  }
}
hi.BitbucketProvider = s_;
var _t = {};
Object.defineProperty(_t, "__esModule", { value: !0 });
_t.GitHubProvider = _t.BaseGitHubProvider = void 0;
_t.computeReleaseNotes = Cf;
const rt = pe, Zt = wf, a_ = lr, er = Me, Vo = ue, Ji = /\/tag\/([^/]+)$/;
class bf extends Vo.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, er.newBaseUrl)((0, rt.githubUrl)(t, r));
    const i = r === "github.com" ? "api.github.com" : r;
    this.baseApiUrl = (0, er.newBaseUrl)((0, rt.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const r = this.options.host;
    return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${t}` : t;
  }
}
_t.BaseGitHubProvider = bf;
class l_ extends bf {
  constructor(t, r, n) {
    super(t, "github.com", n), this.options = t, this.updater = r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, r, n, i, o;
    const s = new rt.CancellationToken(), a = await this.httpRequest((0, er.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, s), l = (0, rt.parseXml)(a);
    let f = l.element("entry", !1, "No published versions on GitHub"), c = null;
    try {
      if (this.updater.allowPrerelease) {
        const _ = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((r = Zt.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
        if (_ === null)
          c = Ji.exec(f.element("link").attribute("href"))[1];
        else
          for (const A of l.getElements("entry")) {
            const T = Ji.exec(A.element("link").attribute("href"));
            if (T === null)
              continue;
            const P = T[1], L = ((n = Zt.prerelease(P)) === null || n === void 0 ? void 0 : n[0]) || null, B = !_ || ["alpha", "beta"].includes(_), H = L !== null && !["alpha", "beta"].includes(String(L));
            if (B && !H && !(_ === "beta" && L === "alpha")) {
              c = P;
              break;
            }
            if (L && L === _) {
              c = P;
              break;
            }
          }
      } else {
        c = await this.getLatestTagName(s);
        for (const _ of l.getElements("entry"))
          if (Ji.exec(_.element("link").attribute("href"))[1] === c) {
            f = _;
            break;
          }
      }
    } catch (_) {
      throw (0, rt.newError)(`Cannot parse releases feed: ${_.stack || _.message},
XML:
${a}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (c == null)
      throw (0, rt.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let u, h = "", m = "";
    const w = async (_) => {
      h = (0, er.getChannelFilename)(_), m = (0, er.newUrlFromBase)(this.getBaseDownloadPath(String(c), h), this.baseUrl);
      const A = this.createRequestOptions(m);
      try {
        return await this.executor.request(A, s);
      } catch (T) {
        throw T instanceof rt.HttpError && T.statusCode === 404 ? (0, rt.newError)(`Cannot find ${h} in the latest release artifacts (${m}): ${T.stack || T.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : T;
      }
    };
    try {
      let _ = this.channel;
      this.updater.allowPrerelease && (!((i = Zt.prerelease(c)) === null || i === void 0) && i[0]) && (_ = this.getCustomChannelName(String((o = Zt.prerelease(c)) === null || o === void 0 ? void 0 : o[0]))), u = await w(_);
    } catch (_) {
      if (this.updater.allowPrerelease)
        u = await w(this.getDefaultChannelName());
      else
        throw _;
    }
    const y = (0, Vo.parseUpdateInfo)(u, h, m);
    return y.releaseName == null && (y.releaseName = f.elementValueOrEmpty("title")), y.releaseNotes == null && (y.releaseNotes = Cf(this.updater.currentVersion, this.updater.fullChangelog, l, f)), {
      tag: c,
      ...y
    };
  }
  async getLatestTagName(t) {
    const r = this.options, n = r.host == null || r.host === "github.com" ? (0, er.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new a_.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const i = await this.httpRequest(n, { Accept: "application/json" }, t);
      return i == null ? null : JSON.parse(i).tag_name;
    } catch (i) {
      throw (0, rt.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, Vo.resolveFiles)(t, this.baseUrl, (r) => this.getBaseDownloadPath(t.tag, r.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, r) {
    return `${this.basePath}/download/${t}/${r}`;
  }
}
_t.GitHubProvider = l_;
function pl(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function Cf(e, t, r, n) {
  if (!t)
    return pl(n);
  const i = [];
  for (const o of r.getElements("entry")) {
    const s = /\/tag\/v?([^/]+)$/.exec(o.element("link").attribute("href"))[1];
    Zt.lt(e, s) && i.push({
      version: s,
      note: pl(o)
    });
  }
  return i.sort((o, s) => Zt.rcompare(o.version, s.version));
}
var pi = {};
Object.defineProperty(pi, "__esModule", { value: !0 });
pi.KeygenProvider = void 0;
const ml = pe, Ki = Me, Qi = ue;
class c_ extends Qi.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, Ki.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new ml.CancellationToken(), r = (0, Ki.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, Ki.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, Qi.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, ml.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Qi.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: r, platform: n } = this.configuration;
    return `Keygen (account: ${t}, product: ${r}, platform: ${n}, channel: ${this.channel})`;
  }
}
pi.KeygenProvider = c_;
var mi = {};
Object.defineProperty(mi, "__esModule", { value: !0 });
mi.PrivateGitHubProvider = void 0;
const Vt = pe, u_ = ve, f_ = K, gl = lr, El = Me, d_ = _t, h_ = ue;
class p_ extends d_.BaseGitHubProvider {
  constructor(t, r, n, i) {
    super(t, "api.github.com", i), this.updater = r, this.token = n;
  }
  createRequestOptions(t, r) {
    const n = super.createRequestOptions(t, r);
    return n.redirect = "manual", n;
  }
  async getLatestVersion() {
    const t = new Vt.CancellationToken(), r = (0, El.getChannelFilename)(this.getDefaultChannelName()), n = await this.getLatestVersionInfo(t), i = n.assets.find((a) => a.name === r);
    if (i == null)
      throw (0, Vt.newError)(`Cannot find ${r} in the release ${n.html_url || n.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const o = new gl.URL(i.url);
    let s;
    try {
      s = (0, u_.load)(await this.httpRequest(o, this.configureHeaders("application/octet-stream"), t));
    } catch (a) {
      throw a instanceof Vt.HttpError && a.statusCode === 404 ? (0, Vt.newError)(`Cannot find ${r} in the latest release artifacts (${o}): ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : a;
    }
    return s.assets = n.assets, s;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(t) {
    return {
      accept: t,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(t) {
    const r = this.updater.allowPrerelease;
    let n = this.basePath;
    r || (n = `${n}/latest`);
    const i = (0, El.newUrlFromBase)(n, this.baseUrl);
    try {
      const o = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      return r ? o.find((s) => s.prerelease) || o[0] : o;
    } catch (o) {
      throw (0, Vt.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, h_.getFileList)(t).map((r) => {
      const n = f_.posix.basename(r.url).replace(/ /g, "-"), i = t.assets.find((o) => o != null && o.name === n);
      if (i == null)
        throw (0, Vt.newError)(`Cannot find asset "${n}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new gl.URL(i.url),
        info: r
      };
    });
  }
}
mi.PrivateGitHubProvider = p_;
Object.defineProperty(di, "__esModule", { value: !0 });
di.isUrlProbablySupportMultiRangeRequests = Of;
di.createClient = v_;
const On = pe, m_ = hi, yl = tn, g_ = _t, E_ = pi, y_ = mi;
function Of(e) {
  return !e.includes("s3.amazonaws.com");
}
function v_(e, t, r) {
  if (typeof e == "string")
    throw (0, On.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const n = e.provider;
  switch (n) {
    case "github": {
      const i = e, o = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return o == null ? new g_.GitHubProvider(i, t, r) : new y_.PrivateGitHubProvider(i, t, o, r);
    }
    case "bitbucket":
      return new m_.BitbucketProvider(e, t, r);
    case "keygen":
      return new E_.KeygenProvider(e, t, r);
    case "s3":
    case "spaces":
      return new yl.GenericProvider({
        provider: "generic",
        url: (0, On.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...r,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new yl.GenericProvider(i, t, {
        ...r,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && Of(i.url)
      });
    }
    case "custom": {
      const i = e, o = i.updateProvider;
      if (!o)
        throw (0, On.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new o(i, t, r);
    }
    default:
      throw (0, On.newError)(`Unsupported provider: ${n}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var gi = {}, rn = {}, dr = {}, jt = {};
Object.defineProperty(jt, "__esModule", { value: !0 });
jt.OperationKind = void 0;
jt.computeOperations = w_;
var Ft;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(Ft || (jt.OperationKind = Ft = {}));
function w_(e, t, r) {
  const n = wl(e.files), i = wl(t.files);
  let o = null;
  const s = t.files[0], a = [], l = s.name, f = n.get(l);
  if (f == null)
    throw new Error(`no file ${l} in old blockmap`);
  const c = i.get(l);
  let u = 0;
  const { checksumToOffset: h, checksumToOldSize: m } = S_(n.get(l), f.offset, r);
  let w = s.offset;
  for (let y = 0; y < c.checksums.length; w += c.sizes[y], y++) {
    const _ = c.sizes[y], A = c.checksums[y];
    let T = h.get(A);
    T != null && m.get(A) !== _ && (r.warn(`Checksum ("${A}") matches, but size differs (old: ${m.get(A)}, new: ${_})`), T = void 0), T === void 0 ? (u++, o != null && o.kind === Ft.DOWNLOAD && o.end === w ? o.end += _ : (o = {
      kind: Ft.DOWNLOAD,
      start: w,
      end: w + _
      // oldBlocks: null,
    }, vl(o, a, A, y))) : o != null && o.kind === Ft.COPY && o.end === T ? o.end += _ : (o = {
      kind: Ft.COPY,
      start: T,
      end: T + _
      // oldBlocks: [checksum]
    }, vl(o, a, A, y));
  }
  return u > 0 && r.info(`File${s.name === "file" ? "" : " " + s.name} has ${u} changed blocks`), a;
}
const __ = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function vl(e, t, r, n) {
  if (__ && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const o = [i.start, i.end, e.start, e.end].reduce((s, a) => s < a ? s : a);
      throw new Error(`operation (block index: ${n}, checksum: ${r}, kind: ${Ft[e.kind]}) overlaps previous operation (checksum: ${r}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - o} until ${i.end - o} and ${e.start - o} until ${e.end - o}`);
    }
  }
  t.push(e);
}
function S_(e, t, r) {
  const n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let o = t;
  for (let s = 0; s < e.checksums.length; s++) {
    const a = e.checksums[s], l = e.sizes[s], f = i.get(a);
    if (f === void 0)
      n.set(a, o), i.set(a, l);
    else if (r.debug != null) {
      const c = f === l ? "(same size)" : `(size: ${f}, this size: ${l})`;
      r.debug(`${a} duplicated in blockmap ${c}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    o += l;
  }
  return { checksumToOffset: n, checksumToOldSize: i };
}
function wl(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    t.set(r.name, r);
  return t;
}
Object.defineProperty(dr, "__esModule", { value: !0 });
dr.DataSplitter = void 0;
dr.copyData = $f;
const $n = pe, A_ = Le, T_ = Wr, b_ = jt, _l = Buffer.from(`\r
\r
`);
var ft;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(ft || (ft = {}));
function $f(e, t, r, n, i) {
  const o = (0, A_.createReadStream)("", {
    fd: r,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  o.on("error", n), o.once("end", i), o.pipe(t, {
    end: !1
  });
}
class C_ extends T_.Writable {
  constructor(t, r, n, i, o, s) {
    super(), this.out = t, this.options = r, this.partIndexToTaskIndex = n, this.partIndexToLength = o, this.finishHandler = s, this.partIndex = -1, this.headerListBuffer = null, this.readState = ft.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(t, r, n) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${t.length} bytes`);
      return;
    }
    this.handleData(t).then(n).catch(n);
  }
  async handleData(t) {
    let r = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
      throw (0, $n.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    if (this.ignoreByteCount > 0) {
      const n = Math.min(this.ignoreByteCount, t.length);
      this.ignoreByteCount -= n, r = n;
    } else if (this.remainingPartDataCount > 0) {
      const n = Math.min(this.remainingPartDataCount, t.length);
      this.remainingPartDataCount -= n, await this.processPartData(t, 0, n), r = n;
    }
    if (r !== t.length) {
      if (this.readState === ft.HEADER) {
        const n = this.searchHeaderListEnd(t, r);
        if (n === -1)
          return;
        r = n, this.readState = ft.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === ft.BODY)
          this.readState = ft.INIT;
        else {
          this.partIndex++;
          let s = this.partIndexToTaskIndex.get(this.partIndex);
          if (s == null)
            if (this.isFinished)
              s = this.options.end;
            else
              throw (0, $n.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const a = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (a < s)
            await this.copyExistingData(a, s);
          else if (a > s)
            throw (0, $n.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (r = this.searchHeaderListEnd(t, r), r === -1) {
            this.readState = ft.HEADER;
            return;
          }
        }
        const n = this.partIndexToLength[this.partIndex], i = r + n, o = Math.min(i, t.length);
        if (await this.processPartStarted(t, r, o), this.remainingPartDataCount = n - (o - r), this.remainingPartDataCount > 0)
          return;
        if (r = i + this.boundaryLength, r >= t.length) {
          this.ignoreByteCount = this.boundaryLength - (t.length - i);
          return;
        }
      }
    }
  }
  copyExistingData(t, r) {
    return new Promise((n, i) => {
      const o = () => {
        if (t === r) {
          n();
          return;
        }
        const s = this.options.tasks[t];
        if (s.kind !== b_.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        $f(s, this.out, this.options.oldFileFd, i, () => {
          t++, o();
        });
      };
      o();
    });
  }
  searchHeaderListEnd(t, r) {
    const n = t.indexOf(_l, r);
    if (n !== -1)
      return n + _l.length;
    const i = r === 0 ? t : t.slice(r);
    return this.headerListBuffer == null ? this.headerListBuffer = i : this.headerListBuffer = Buffer.concat([this.headerListBuffer, i]), -1;
  }
  onPartEnd() {
    const t = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== t)
      throw (0, $n.newError)(`Expected length: ${t} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    this.actualPartLength = 0;
  }
  processPartStarted(t, r, n) {
    return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(t, r, n);
  }
  processPartData(t, r, n) {
    this.actualPartLength += n - r;
    const i = this.out;
    return i.write(r === 0 && t.length === n ? t : t.slice(r, n)) ? Promise.resolve() : new Promise((o, s) => {
      i.on("error", s), i.once("drain", () => {
        i.removeListener("error", s), o();
      });
    });
  }
}
dr.DataSplitter = C_;
var Ei = {};
Object.defineProperty(Ei, "__esModule", { value: !0 });
Ei.executeTasksUsingMultipleRangeRequests = O_;
Ei.checkIsRangesSupported = Yo;
const zo = pe, Sl = dr, Al = jt;
function O_(e, t, r, n, i) {
  const o = (s) => {
    if (s >= t.length) {
      e.fileMetadataBuffer != null && r.write(e.fileMetadataBuffer), r.end();
      return;
    }
    const a = s + 1e3;
    $_(e, {
      tasks: t,
      start: s,
      end: Math.min(t.length, a),
      oldFileFd: n
    }, r, () => o(a), i);
  };
  return o;
}
function $_(e, t, r, n, i) {
  let o = "bytes=", s = 0;
  const a = /* @__PURE__ */ new Map(), l = [];
  for (let u = t.start; u < t.end; u++) {
    const h = t.tasks[u];
    h.kind === Al.OperationKind.DOWNLOAD && (o += `${h.start}-${h.end - 1}, `, a.set(s, u), s++, l.push(h.end - h.start));
  }
  if (s <= 1) {
    const u = (h) => {
      if (h >= t.end) {
        n();
        return;
      }
      const m = t.tasks[h++];
      if (m.kind === Al.OperationKind.COPY)
        (0, Sl.copyData)(m, r, t.oldFileFd, i, () => u(h));
      else {
        const w = e.createRequestOptions();
        w.headers.Range = `bytes=${m.start}-${m.end - 1}`;
        const y = e.httpExecutor.createRequest(w, (_) => {
          Yo(_, i) && (_.pipe(r, {
            end: !1
          }), _.once("end", () => u(h)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(y, i), y.end();
      }
    };
    u(t.start);
    return;
  }
  const f = e.createRequestOptions();
  f.headers.Range = o.substring(0, o.length - 2);
  const c = e.httpExecutor.createRequest(f, (u) => {
    if (!Yo(u, i))
      return;
    const h = (0, zo.safeGetHeader)(u, "content-type"), m = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(h);
    if (m == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${h}"`));
      return;
    }
    const w = new Sl.DataSplitter(r, t, a, m[1] || m[2], l, n);
    w.on("error", i), u.pipe(w), u.on("end", () => {
      setTimeout(() => {
        c.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(c, i), c.end();
}
function Yo(e, t) {
  if (e.statusCode >= 400)
    return t((0, zo.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const r = (0, zo.safeGetHeader)(e, "accept-ranges");
    if (r == null || r === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var yi = {};
Object.defineProperty(yi, "__esModule", { value: !0 });
yi.ProgressDifferentialDownloadCallbackTransform = void 0;
const R_ = Wr;
var tr;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(tr || (tr = {}));
class I_ extends R_.Transform {
  constructor(t, r, n) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = tr.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == tr.COPY) {
      n(null, t);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  beginFileCopy() {
    this.operationType = tr.COPY;
  }
  beginRangeDownload() {
    this.operationType = tr.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
  }
  // Called when we are 100% done with the connection/download
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, this.transferred = 0, t(null);
  }
}
yi.ProgressDifferentialDownloadCallbackTransform = I_;
Object.defineProperty(rn, "__esModule", { value: !0 });
rn.DifferentialDownloader = void 0;
const _r = pe, Zi = At, N_ = Le, P_ = dr, D_ = lr, Rn = jt, Tl = Ei, F_ = yi;
class L_ {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(t, r, n) {
    this.blockAwareFileInfo = t, this.httpExecutor = r, this.options = n, this.fileMetadataBuffer = null, this.logger = n.logger;
  }
  createRequestOptions() {
    const t = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    return (0, _r.configureRequestUrl)(this.options.newUrl, t), (0, _r.configureRequestOptions)(t), t;
  }
  doDownload(t, r) {
    if (t.version !== r.version)
      throw new Error(`version is different (${t.version} - ${r.version}), full download is required`);
    const n = this.logger, i = (0, Rn.computeOperations)(t, r, n);
    n.debug != null && n.debug(JSON.stringify(i, null, 2));
    let o = 0, s = 0;
    for (const l of i) {
      const f = l.end - l.start;
      l.kind === Rn.OperationKind.DOWNLOAD ? o += f : s += f;
    }
    const a = this.blockAwareFileInfo.size;
    if (o + s + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== a)
      throw new Error(`Internal error, size mismatch: downloadSize: ${o}, copySize: ${s}, newSize: ${a}`);
    return n.info(`Full: ${bl(a)}, To download: ${bl(o)} (${Math.round(o / (a / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const r = [], n = () => Promise.all(r.map((i) => (0, Zi.close)(i.descriptor).catch((o) => {
      this.logger.error(`cannot close file "${i.path}": ${o}`);
    })));
    return this.doDownloadFile(t, r).then(n).catch((i) => n().catch((o) => {
      try {
        this.logger.error(`cannot close files: ${o}`);
      } catch (s) {
        try {
          console.error(s);
        } catch {
        }
      }
      throw i;
    }).then(() => {
      throw i;
    }));
  }
  async doDownloadFile(t, r) {
    const n = await (0, Zi.open)(this.options.oldFile, "r");
    r.push({ descriptor: n, path: this.options.oldFile });
    const i = await (0, Zi.open)(this.options.newFile, "w");
    r.push({ descriptor: i, path: this.options.newFile });
    const o = (0, N_.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((s, a) => {
      const l = [];
      let f;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const A = [];
        let T = 0;
        for (const L of t)
          L.kind === Rn.OperationKind.DOWNLOAD && (A.push(L.end - L.start), T += L.end - L.start);
        const P = {
          expectedByteCounts: A,
          grandTotal: T
        };
        f = new F_.ProgressDifferentialDownloadCallbackTransform(P, this.options.cancellationToken, this.options.onProgress), l.push(f);
      }
      const c = new _r.DigestTransform(this.blockAwareFileInfo.sha512);
      c.isValidateOnEnd = !1, l.push(c), o.on("finish", () => {
        o.close(() => {
          r.splice(1, 1);
          try {
            c.validate();
          } catch (A) {
            a(A);
            return;
          }
          s(void 0);
        });
      }), l.push(o);
      let u = null;
      for (const A of l)
        A.on("error", a), u == null ? u = A : u = u.pipe(A);
      const h = l[0];
      let m;
      if (this.options.isUseMultipleRangeRequest) {
        m = (0, Tl.executeTasksUsingMultipleRangeRequests)(this, t, h, n, a), m(0);
        return;
      }
      let w = 0, y = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const _ = this.createRequestOptions();
      _.redirect = "manual", m = (A) => {
        var T, P;
        if (A >= t.length) {
          this.fileMetadataBuffer != null && h.write(this.fileMetadataBuffer), h.end();
          return;
        }
        const L = t[A++];
        if (L.kind === Rn.OperationKind.COPY) {
          f && f.beginFileCopy(), (0, P_.copyData)(L, h, n, a, () => m(A));
          return;
        }
        const B = `bytes=${L.start}-${L.end - 1}`;
        _.headers.range = B, (P = (T = this.logger) === null || T === void 0 ? void 0 : T.debug) === null || P === void 0 || P.call(T, `download range: ${B}`), f && f.beginRangeDownload();
        const H = this.httpExecutor.createRequest(_, (j) => {
          j.on("error", a), j.on("aborted", () => {
            a(new Error("response has been aborted by the server"));
          }), j.statusCode >= 400 && a((0, _r.createHttpError)(j)), j.pipe(h, {
            end: !1
          }), j.once("end", () => {
            f && f.endRangeDownload(), ++w === 100 ? (w = 0, setTimeout(() => m(A), 1e3)) : m(A);
          });
        });
        H.on("redirect", (j, ae, E) => {
          this.logger.info(`Redirect to ${x_(E)}`), y = E, (0, _r.configureRequestUrl)(new D_.URL(y), _), H.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(H, a), H.end();
      }, m(0);
    });
  }
  async readRemoteBytes(t, r) {
    const n = Buffer.allocUnsafe(r + 1 - t), i = this.createRequestOptions();
    i.headers.range = `bytes=${t}-${r}`;
    let o = 0;
    if (await this.request(i, (s) => {
      s.copy(n, o), o += s.length;
    }), o !== n.length)
      throw new Error(`Received data length ${o} is not equal to expected ${n.length}`);
    return n;
  }
  request(t, r) {
    return new Promise((n, i) => {
      const o = this.httpExecutor.createRequest(t, (s) => {
        (0, Tl.checkIsRangesSupported)(s, i) && (s.on("error", i), s.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), s.on("data", r), s.on("end", () => n()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(o, i), o.end();
    });
  }
}
rn.DifferentialDownloader = L_;
function bl(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function x_(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.GenericDifferentialDownloader = void 0;
const U_ = rn;
class k_ extends U_.DifferentialDownloader {
  download(t, r) {
    return this.doDownload(t, r);
  }
}
gi.GenericDifferentialDownloader = k_;
var Tt = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
  const t = pe;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class r {
    constructor(o) {
      this.emitter = o;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(o) {
      n(this.emitter, "login", o);
    }
    progress(o) {
      n(this.emitter, e.DOWNLOAD_PROGRESS, o);
    }
    updateDownloaded(o) {
      n(this.emitter, e.UPDATE_DOWNLOADED, o);
    }
    updateCancelled(o) {
      n(this.emitter, "update-cancelled", o);
    }
  }
  e.UpdaterSignal = r;
  function n(i, o, s) {
    i.on(o, s);
  }
})(Tt);
Object.defineProperty(Et, "__esModule", { value: !0 });
Et.NoOpLogger = Et.AppUpdater = void 0;
const Te = pe, M_ = zr, j_ = St, B_ = Jn, zt = At, H_ = ve, eo = oi, It = K, Pt = wf, Cl = en, q_ = fi, Ol = _f, G_ = tn, to = di, W_ = Sc, V_ = Me, z_ = gi, Yt = Tt;
class Os extends B_.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(t) {
    if (this._channel != null) {
      if (typeof t != "string")
        throw (0, Te.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, Te.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
    }
    this._channel = t, this.allowDowngrade = !0;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(t) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: t
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, Ol.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new Rf();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new eo.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(t) {
    t && (this._isUpdateSupported = t);
  }
  constructor(t, r) {
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new Yt.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (o) => this.checkIfUpdateSupported(o), this.clientPromise = null, this.stagingUserIdPromise = new eo.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new eo.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (o) => {
      this._logger.error(`Error: ${o.stack || o.message}`);
    }), r == null ? (this.app = new q_.ElectronAppAdapter(), this.httpExecutor = new Ol.ElectronHttpExecutor((o, s) => this.emit("login", o, s))) : (this.app = r, this.httpExecutor = null);
    const n = this.app.version, i = (0, Pt.parse)(n);
    if (i == null)
      throw (0, Te.newError)(`App version is not a valid semver version: "${n}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = Y_(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(t) {
    const r = this.createProviderRuntimeOptions();
    let n;
    typeof t == "string" ? n = new G_.GenericProvider({ provider: "generic", url: t }, this, {
      ...r,
      isUseMultipleRangeRequest: (0, to.isUrlProbablySupportMultiRangeRequests)(t)
    }) : n = (0, to.createClient)(t, this, r), this.clientPromise = Promise.resolve(n);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive())
      return Promise.resolve(null);
    let t = this.checkForUpdatesPromise;
    if (t != null)
      return this._logger.info("Checking for update (already in progress)"), t;
    const r = () => this.checkForUpdatesPromise = null;
    return this._logger.info("Checking for update"), t = this.doCheckForUpdates().then((n) => (r(), n)).catch((n) => {
      throw r(), this.emit("error", n, `Cannot check for updates: ${(n.stack || n).toString()}`), n;
    }), this.checkForUpdatesPromise = t, t;
  }
  isUpdaterActive() {
    return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(t) {
    return this.checkForUpdates().then((r) => r != null && r.downloadPromise ? (r.downloadPromise.then(() => {
      const n = Os.formatDownloadNotification(r.updateInfo.version, this.app.name, t);
      new gt.Notification(n).show();
    }), r) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), r));
  }
  static formatDownloadNotification(t, r, n) {
    return n == null && (n = {
      title: "A new update is ready to install",
      body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
    }), n = {
      title: n.title.replace("{appName}", r).replace("{version}", t),
      body: n.body.replace("{appName}", r).replace("{version}", t)
    }, n;
  }
  async isStagingMatch(t) {
    const r = t.stagingPercentage;
    let n = r;
    if (n == null)
      return !0;
    if (n = parseInt(n, 10), isNaN(n))
      return this._logger.warn(`Staging percentage is NaN: ${r}`), !0;
    n = n / 100;
    const i = await this.stagingUserIdPromise.value, s = Te.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${n}, percentage: ${s}, user id: ${i}`), s < n;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const r = (0, Pt.parse)(t.version);
    if (r == null)
      throw (0, Te.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const n = this.currentVersion;
    if ((0, Pt.eq)(r, n) || !await Promise.resolve(this.isUpdateSupported(t)) || !await this.isStagingMatch(t))
      return !1;
    const o = (0, Pt.gt)(r, n), s = (0, Pt.lt)(r, n);
    return o ? !0 : this.allowDowngrade && s;
  }
  checkIfUpdateSupported(t) {
    const r = t == null ? void 0 : t.minimumSystemVersion, n = (0, j_.release)();
    if (r)
      try {
        if ((0, Pt.lt)(n, r))
          return this._logger.info(`Current OS version ${n} is less than the minimum OS version required ${r} for version ${n}`), !1;
      } catch (i) {
        this._logger.warn(`Failed to compare current OS version(${n}) with minimum OS version(${r}): ${(i.message || i).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((n) => (0, to.createClient)(n, this, this.createProviderRuntimeOptions())));
    const t = await this.clientPromise, r = await this.stagingUserIdPromise.value;
    return t.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": r })), {
      info: await t.getLatestVersion(),
      provider: t
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: !0,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const t = await this.getUpdateInfoAndProvider(), r = t.info;
    if (!await this.isUpdateAvailable(r))
      return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${r.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", r), {
        isUpdateAvailable: !1,
        versionInfo: r,
        updateInfo: r
      };
    this.updateInfoAndProvider = t, this.onUpdateAvailable(r);
    const n = new Te.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: r,
      updateInfo: r,
      cancellationToken: n,
      downloadPromise: this.autoDownload ? this.downloadUpdate(n) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, Te.asArray)(t.files).map((r) => r.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new Te.CancellationToken()) {
    const r = this.updateInfoAndProvider;
    if (r == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, Te.asArray)(r.info.files).map((i) => i.url).join(", ")}`);
    const n = (i) => {
      if (!(i instanceof Te.CancellationError))
        try {
          this.dispatchError(i);
        } catch (o) {
          this._logger.warn(`Cannot dispatch error event: ${o.stack || o}`);
        }
      return i;
    };
    return this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider: r,
      requestHeaders: this.computeRequestHeaders(r.provider),
      cancellationToken: t,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((i) => {
      throw n(i);
    }).finally(() => {
      this.downloadPromise = null;
    }), this.downloadPromise;
  }
  dispatchError(t) {
    this.emit("error", t, (t.stack || t).toString());
  }
  dispatchUpdateDownloaded(t) {
    this.emit(Yt.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, H_.load)(await (0, zt.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(t) {
    const r = t.fileExtraDownloadHeaders;
    if (r != null) {
      const n = this.requestHeaders;
      return n == null ? r : {
        ...r,
        ...n
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const t = It.join(this.app.userDataPath, ".updaterId");
    try {
      const n = await (0, zt.readFile)(t, "utf-8");
      if (Te.UUID.check(n))
        return n;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${n}`);
    } catch (n) {
      n.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${n}`);
    }
    const r = Te.UUID.v5((0, M_.randomBytes)(4096), Te.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${r}`);
    try {
      await (0, zt.outputFile)(t, r);
    } catch (n) {
      this._logger.warn(`Couldn't write out staging user ID: ${n}`);
    }
    return r;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const t = this.requestHeaders;
    if (t == null)
      return !0;
    for (const r of Object.keys(t)) {
      const n = r.toLowerCase();
      if (n === "authorization" || n === "private-token")
        return !1;
    }
    return !0;
  }
  async getOrCreateDownloadHelper() {
    let t = this.downloadedUpdateHelper;
    if (t == null) {
      const r = (await this.configOnDisk.value).updaterCacheDirName, n = this._logger;
      r == null && n.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      const i = It.join(this.app.baseCachePath, r || this.app.name);
      n.debug != null && n.debug(`updater cache dir: ${i}`), t = new Cl.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
    }
    return t;
  }
  async executeDownload(t) {
    const r = t.fileInfo, n = {
      headers: t.downloadUpdateOptions.requestHeaders,
      cancellationToken: t.downloadUpdateOptions.cancellationToken,
      sha2: r.info.sha2,
      sha512: r.info.sha512
    };
    this.listenerCount(Yt.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (T) => this.emit(Yt.DOWNLOAD_PROGRESS, T));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, o = i.version, s = r.packageInfo;
    function a() {
      const T = decodeURIComponent(t.fileInfo.url.pathname);
      return T.endsWith(`.${t.fileExtension}`) ? It.basename(T) : t.fileInfo.info.url;
    }
    const l = await this.getOrCreateDownloadHelper(), f = l.cacheDirForPendingUpdate;
    await (0, zt.mkdir)(f, { recursive: !0 });
    const c = a();
    let u = It.join(f, c);
    const h = s == null ? null : It.join(f, `package-${o}${It.extname(s.path) || ".7z"}`), m = async (T) => (await l.setDownloadedFile(u, h, i, r, c, T), await t.done({
      ...i,
      downloadedFile: u
    }), h == null ? [u] : [u, h]), w = this._logger, y = await l.validateDownloadedPath(u, i, r, w);
    if (y != null)
      return u = y, await m(!1);
    const _ = async () => (await l.clear().catch(() => {
    }), await (0, zt.unlink)(u).catch(() => {
    })), A = await (0, Cl.createTempUpdateFile)(`temp-${c}`, f, w);
    try {
      await t.task(A, n, h, _), await (0, Te.retry)(() => (0, zt.rename)(A, u), 60, 500, 0, 0, (T) => T instanceof Error && /^EBUSY:/.test(T.message));
    } catch (T) {
      throw await _(), T instanceof Te.CancellationError && (w.info("cancelled"), this.emit("update-cancelled", i)), T;
    }
    return w.info(`New version ${o} has been downloaded to ${u}`), await m(!0);
  }
  async differentialDownloadInstaller(t, r, n, i, o) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const s = (0, V_.blockmapFiles)(t.url, this.app.version, r.updateInfoAndProvider.info.version);
      this._logger.info(`Download block maps (old: "${s[0]}", new: ${s[1]})`);
      const a = async (c) => {
        const u = await this.httpExecutor.downloadToBuffer(c, {
          headers: r.requestHeaders,
          cancellationToken: r.cancellationToken
        });
        if (u == null || u.length === 0)
          throw new Error(`Blockmap "${c.href}" is empty`);
        try {
          return JSON.parse((0, W_.gunzipSync)(u).toString());
        } catch (h) {
          throw new Error(`Cannot parse blockmap "${c.href}", error: ${h}`);
        }
      }, l = {
        newUrl: t.url,
        oldFile: It.join(this.downloadedUpdateHelper.cacheDir, o),
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: r.requestHeaders,
        cancellationToken: r.cancellationToken
      };
      this.listenerCount(Yt.DOWNLOAD_PROGRESS) > 0 && (l.onProgress = (c) => this.emit(Yt.DOWNLOAD_PROGRESS, c));
      const f = await Promise.all(s.map((c) => a(c)));
      return await new z_.GenericDifferentialDownloader(t.info, this.httpExecutor, l).download(f[0], f[1]), !1;
    } catch (s) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), this._testOnlyOptions != null)
        throw s;
      return !0;
    }
  }
}
Et.AppUpdater = Os;
function Y_(e) {
  const t = (0, Pt.prerelease)(e);
  return t != null && t.length > 0;
}
class Rf {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(t) {
  }
}
Et.NoOpLogger = Rf;
Object.defineProperty(it, "__esModule", { value: !0 });
it.BaseUpdater = void 0;
const $l = Vr, X_ = Et;
class J_ extends X_.AppUpdater {
  constructor(t, r) {
    super(t, r), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, r = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? r : this.autoRunAppAfterInstall) ? setImmediate(() => {
      gt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
    }) : this.quitAndInstallCalled = !1;
  }
  executeDownload(t) {
    return super.executeDownload({
      ...t,
      done: (r) => (this.dispatchUpdateDownloaded(r), this.addQuitHandler(), Promise.resolve())
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(t = !1, r = !1) {
    if (this.quitAndInstallCalled)
      return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
    const n = this.downloadedUpdateHelper, i = this.installerPath, o = n == null ? null : n.downloadedFileInfo;
    if (i == null || o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${r}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: r,
        isAdminRightsRequired: o.isAdminRightsRequired
      });
    } catch (s) {
      return this.dispatchError(s), !1;
    }
  }
  addQuitHandler() {
    this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((t) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (t !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${t}`);
        return;
      }
      this._logger.info("Auto install update on quit"), this.install(!0, !1);
    }));
  }
  wrapSudo() {
    const { name: t } = this.app, r = `"${t} would like to update"`, n = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), i = [n];
    return /kdesudo/i.test(n) ? (i.push("--comment", r), i.push("-c")) : /gksudo/i.test(n) ? i.push("--message", r) : /pkexec/i.test(n) && i.push("--disable-internal-agent"), i.join(" ");
  }
  spawnSyncLog(t, r = [], n = {}) {
    this._logger.info(`Executing: ${t} with args: ${r}`);
    const i = (0, $l.spawnSync)(t, r, {
      env: { ...process.env, ...n },
      encoding: "utf-8",
      shell: !0
    }), { error: o, status: s, stdout: a, stderr: l } = i;
    if (o != null)
      throw this._logger.error(l), o;
    if (s != null && s !== 0)
      throw this._logger.error(l), new Error(`Command ${t} exited with code ${s}`);
    return a.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(t, r = [], n = void 0, i = "ignore") {
    return this._logger.info(`Executing: ${t} with args: ${r}`), new Promise((o, s) => {
      try {
        const a = { stdio: i, env: n, detached: !0 }, l = (0, $l.spawn)(t, r, a);
        l.on("error", (f) => {
          s(f);
        }), l.unref(), l.pid !== void 0 && o(!0);
      } catch (a) {
        s(a);
      }
    });
  }
}
it.BaseUpdater = J_;
var Mr = {}, nn = {};
Object.defineProperty(nn, "__esModule", { value: !0 });
nn.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const Xt = At, K_ = rn, Q_ = Sc;
class Z_ extends K_.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, r = t.size, n = r - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(n, r - 1);
    const i = If(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await eS(this.options.oldFile), i);
  }
}
nn.FileWithEmbeddedBlockMapDifferentialDownloader = Z_;
function If(e) {
  return JSON.parse((0, Q_.inflateRawSync)(e).toString());
}
async function eS(e) {
  const t = await (0, Xt.open)(e, "r");
  try {
    const r = (await (0, Xt.fstat)(t)).size, n = Buffer.allocUnsafe(4);
    await (0, Xt.read)(t, n, 0, n.length, r - n.length);
    const i = Buffer.allocUnsafe(n.readUInt32BE(0));
    return await (0, Xt.read)(t, i, 0, i.length, r - n.length - i.length), await (0, Xt.close)(t), If(i);
  } catch (r) {
    throw await (0, Xt.close)(t), r;
  }
}
Object.defineProperty(Mr, "__esModule", { value: !0 });
Mr.AppImageUpdater = void 0;
const Rl = pe, Il = Vr, tS = At, rS = Le, Sr = K, nS = it, iS = nn, oS = ue, Nl = Tt;
class sS extends nS.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, oS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        const s = process.env.APPIMAGE;
        if (s == null)
          throw (0, Rl.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(n, s, i, r, t)) && await this.httpExecutor.download(n.url, i, o), await (0, tS.chmod)(i, 493);
      }
    });
  }
  async downloadDifferential(t, r, n, i, o) {
    try {
      const s = {
        newUrl: t.url,
        oldFile: r,
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: o.requestHeaders,
        cancellationToken: o.cancellationToken
      };
      return this.listenerCount(Nl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(Nl.DOWNLOAD_PROGRESS, a)), await new iS.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, s).download(), !1;
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const r = process.env.APPIMAGE;
    if (r == null)
      throw (0, Rl.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, rS.unlinkSync)(r);
    let n;
    const i = Sr.basename(r), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    Sr.basename(o) === i || !/\d+\.\d+\.\d+/.test(i) ? n = r : n = Sr.join(Sr.dirname(r), Sr.basename(o)), (0, Il.execFileSync)("mv", ["-f", o, n]), n !== r && this.emit("appimage-filename-updated", n);
    const s = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(n, [], s) : (s.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, Il.execFileSync)(n, [], { env: s })), !0;
  }
}
Mr.AppImageUpdater = sS;
var jr = {};
Object.defineProperty(jr, "__esModule", { value: !0 });
jr.DebUpdater = void 0;
const aS = it, lS = ue, Pl = Tt;
class cS extends aS.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, lS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Pl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Pl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.installerPath;
    if (i == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    const o = ["dpkg", "-i", i, "||", "apt-get", "install", "-f", "-y"];
    return this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${o.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
jr.DebUpdater = cS;
var Br = {};
Object.defineProperty(Br, "__esModule", { value: !0 });
Br.PacmanUpdater = void 0;
const uS = it, Dl = Tt, fS = ue;
class dS extends uS.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, fS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Dl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Dl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.installerPath;
    if (i == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    const o = ["pacman", "-U", "--noconfirm", i];
    return this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${o.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
Br.PacmanUpdater = dS;
var Hr = {};
Object.defineProperty(Hr, "__esModule", { value: !0 });
Hr.RpmUpdater = void 0;
const hS = it, Fl = Tt, pS = ue;
class mS extends hS.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, pS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Fl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Fl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.spawnSyncLog("which zypper"), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    let s;
    return i ? s = [i, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", o] : s = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", o], this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${s.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
Hr.RpmUpdater = mS;
var qr = {};
Object.defineProperty(qr, "__esModule", { value: !0 });
qr.MacUpdater = void 0;
const Ll = pe, ro = At, gS = Le, xl = K, ES = Ac, yS = Et, vS = ue, Ul = Vr, kl = zr;
class wS extends yS.AppUpdater {
  constructor(t, r) {
    super(t, r), this.nativeUpdater = gt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (n) => {
      this._logger.warn(n), this.emit("error", n);
    }), this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
    });
  }
  debug(t) {
    this._logger.debug != null && this._logger.debug(t);
  }
  closeServerIfExists() {
    this.server && (this.debug("Closing proxy server"), this.server.close((t) => {
      t && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
    }));
  }
  async doDownloadUpdate(t) {
    let r = t.updateInfoAndProvider.provider.resolveFiles(t.updateInfoAndProvider.info);
    const n = this._logger, i = "sysctl.proc_translated";
    let o = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), o = (0, Ul.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), n.info(`Checked for macOS Rosetta environment (isRosetta=${o})`);
    } catch (u) {
      n.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${u}`);
    }
    let s = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const h = (0, Ul.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      n.info(`Checked 'uname -a': arm64=${h}`), s = s || h;
    } catch (u) {
      n.warn(`uname shell command to check for arm64 failed: ${u}`);
    }
    s = s || process.arch === "arm64" || o;
    const a = (u) => {
      var h;
      return u.url.pathname.includes("arm64") || ((h = u.info.url) === null || h === void 0 ? void 0 : h.includes("arm64"));
    };
    s && r.some(a) ? r = r.filter((u) => s === a(u)) : r = r.filter((u) => !a(u));
    const l = (0, vS.findFile)(r, "zip", ["pkg", "dmg"]);
    if (l == null)
      throw (0, Ll.newError)(`ZIP file not provided: ${(0, Ll.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const f = t.updateInfoAndProvider.provider, c = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: l,
      downloadUpdateOptions: t,
      task: async (u, h) => {
        const m = xl.join(this.downloadedUpdateHelper.cacheDir, c), w = () => (0, ro.pathExistsSync)(m) ? !t.disableDifferentialDownload : (n.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let y = !0;
        w() && (y = await this.differentialDownloadInstaller(l, t, u, f, c)), y && await this.httpExecutor.download(l.url, u, h);
      },
      done: async (u) => {
        if (!t.disableDifferentialDownload)
          try {
            const h = xl.join(this.downloadedUpdateHelper.cacheDir, c);
            await (0, ro.copyFile)(u.downloadedFile, h);
          } catch (h) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${h.message}`);
          }
        return this.updateDownloaded(l, u);
      }
    });
  }
  async updateDownloaded(t, r) {
    var n;
    const i = r.downloadedFile, o = (n = t.info.size) !== null && n !== void 0 ? n : (await (0, ro.stat)(i)).size, s = this._logger, a = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${a})`), this.server = (0, ES.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${a})`), this.server.on("close", () => {
      s.info(`Proxy server for native Squirrel.Mac is closed (${a})`);
    });
    const l = (f) => {
      const c = f.address();
      return typeof c == "string" ? c : `http://127.0.0.1:${c == null ? void 0 : c.port}`;
    };
    return await new Promise((f, c) => {
      const u = (0, kl.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), h = Buffer.from(`autoupdater:${u}`, "ascii"), m = `/${(0, kl.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (w, y) => {
        const _ = w.url;
        if (s.info(`${_} requested`), _ === "/") {
          if (!w.headers.authorization || w.headers.authorization.indexOf("Basic ") === -1) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), s.warn("No authenthication info");
            return;
          }
          const P = w.headers.authorization.split(" ")[1], L = Buffer.from(P, "base64").toString("ascii"), [B, H] = L.split(":");
          if (B !== "autoupdater" || H !== u) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), s.warn("Invalid authenthication credentials");
            return;
          }
          const j = Buffer.from(`{ "url": "${l(this.server)}${m}" }`);
          y.writeHead(200, { "Content-Type": "application/json", "Content-Length": j.length }), y.end(j);
          return;
        }
        if (!_.startsWith(m)) {
          s.warn(`${_} requested, but not supported`), y.writeHead(404), y.end();
          return;
        }
        s.info(`${m} requested by Squirrel.Mac, pipe ${i}`);
        let A = !1;
        y.on("finish", () => {
          A || (this.nativeUpdater.removeListener("error", c), f([]));
        });
        const T = (0, gS.createReadStream)(i);
        T.on("error", (P) => {
          try {
            y.end();
          } catch (L) {
            s.warn(`cannot end response: ${L}`);
          }
          A = !0, this.nativeUpdater.removeListener("error", c), c(new Error(`Cannot pipe "${i}": ${P}`));
        }), y.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": o
        }), T.pipe(y);
      }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${a})`), this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${l(this.server)}, ${a})`), this.nativeUpdater.setFeedURL({
          url: l(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${h.toString("base64")}`
          }
        }), this.dispatchUpdateDownloaded(r), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", c), this.nativeUpdater.checkForUpdates()) : f([]);
      });
    });
  }
  handleUpdateDownloaded() {
    this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
  }
  quitAndInstall() {
    this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
  }
}
qr.MacUpdater = wS;
var Gr = {}, $s = {};
Object.defineProperty($s, "__esModule", { value: !0 });
$s.verifySignature = SS;
const Ml = pe, Nf = Vr, _S = St, jl = K;
function SS(e, t, r) {
  return new Promise((n, i) => {
    const o = t.replace(/'/g, "''");
    r.info(`Verifying signature ${o}`), (0, Nf.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${o}' | ConvertTo-Json -Compress"`], {
      shell: !0,
      timeout: 20 * 1e3
    }, (s, a, l) => {
      var f;
      try {
        if (s != null || l) {
          no(r, s, l, i), n(null);
          return;
        }
        const c = AS(a);
        if (c.Status === 0) {
          try {
            const w = jl.normalize(c.Path), y = jl.normalize(t);
            if (r.info(`LiteralPath: ${w}. Update Path: ${y}`), w !== y) {
              no(r, new Error(`LiteralPath of ${w} is different than ${y}`), l, i), n(null);
              return;
            }
          } catch (w) {
            r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(f = w.message) !== null && f !== void 0 ? f : w.stack}`);
          }
          const h = (0, Ml.parseDn)(c.SignerCertificate.Subject);
          let m = !1;
          for (const w of e) {
            const y = (0, Ml.parseDn)(w);
            if (y.size ? m = Array.from(y.keys()).every((A) => y.get(A) === h.get(A)) : w === h.get("CN") && (r.warn(`Signature validated using only CN ${w}. Please add your full Distinguished Name (DN) to publisherNames configuration`), m = !0), m) {
              n(null);
              return;
            }
          }
        }
        const u = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(c, (h, m) => h === "RawData" ? void 0 : m, 2);
        r.warn(`Sign verification failed, installer signed with incorrect certificate: ${u}`), n(u);
      } catch (c) {
        no(r, c, null, i), n(null);
        return;
      }
    });
  });
}
function AS(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const r = t.SignerCertificate;
  return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), t;
}
function no(e, t, r, n) {
  if (TS()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, Nf.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && n(t), r && n(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
}
function TS() {
  const e = _S.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(Gr, "__esModule", { value: !0 });
Gr.NsisUpdater = void 0;
const In = pe, Bl = K, bS = it, CS = nn, Hl = Tt, OS = ue, $S = At, RS = $s, ql = lr;
class IS extends bS.BaseUpdater {
  constructor(t, r) {
    super(t, r), this._verifyUpdateCodeSignature = (n, i) => (0, RS.verifySignature)(n, i, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(t) {
    t && (this._verifyUpdateCodeSignature = t);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, OS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: n,
      task: async (i, o, s, a) => {
        const l = n.packageInfo, f = l != null && s != null;
        if (f && t.disableWebInstaller)
          throw (0, In.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !f && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (f || t.disableDifferentialDownload || await this.differentialDownloadInstaller(n, t, i, r, In.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(n.url, i, o);
        const c = await this.verifySignature(i);
        if (c != null)
          throw await a(), (0, In.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${c}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (f && await this.differentialDownloadWebPackage(t, l, s, r))
          try {
            await this.httpExecutor.download(new ql.URL(l.path), s, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: l.sha512
            });
          } catch (u) {
            try {
              await (0, $S.unlink)(s);
            } catch {
            }
            throw u;
          }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(t) {
    let r;
    try {
      if (r = (await this.configOnDisk.value).publisherName, r == null)
        return null;
    } catch (n) {
      if (n.code === "ENOENT")
        return null;
      throw n;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(r) ? r : [r], t);
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    const n = ["--updated"];
    t.isSilent && n.push("/S"), t.isForceRunAfter && n.push("--force-run"), this.installDirectory && n.push(`/D=${this.installDirectory}`);
    const i = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    i != null && n.push(`--package-file=${i}`);
    const o = () => {
      this.spawnLog(Bl.join(process.resourcesPath, "elevate.exe"), [r].concat(n)).catch((s) => this.dispatchError(s));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), o(), !0) : (this.spawnLog(r, n).catch((s) => {
      const a = s.code;
      this._logger.info(`Cannot run installer: error code: ${a}, error message: "${s.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), a === "UNKNOWN" || a === "EACCES" ? o() : a === "ENOENT" ? gt.shell.openPath(r).catch((l) => this.dispatchError(l)) : this.dispatchError(s);
    }), !0);
  }
  async differentialDownloadWebPackage(t, r, n, i) {
    if (r.blockMapSize == null)
      return !0;
    try {
      const o = {
        newUrl: new ql.URL(r.path),
        oldFile: Bl.join(this.downloadedUpdateHelper.cacheDir, In.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: n,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(Hl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Hl.DOWNLOAD_PROGRESS, s)), await new CS.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, o).download();
    } catch (o) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), process.platform === "win32";
    }
    return !1;
  }
}
Gr.NsisUpdater = IS;
(function(e) {
  var t = be && be.__createBinding || (Object.create ? function(_, A, T, P) {
    P === void 0 && (P = T);
    var L = Object.getOwnPropertyDescriptor(A, T);
    (!L || ("get" in L ? !A.__esModule : L.writable || L.configurable)) && (L = { enumerable: !0, get: function() {
      return A[T];
    } }), Object.defineProperty(_, P, L);
  } : function(_, A, T, P) {
    P === void 0 && (P = T), _[P] = A[T];
  }), r = be && be.__exportStar || function(_, A) {
    for (var T in _) T !== "default" && !Object.prototype.hasOwnProperty.call(A, T) && t(A, _, T);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const n = At, i = K;
  var o = it;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return o.BaseUpdater;
  } });
  var s = Et;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return s.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return s.NoOpLogger;
  } });
  var a = ue;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return a.Provider;
  } });
  var l = Mr;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return l.AppImageUpdater;
  } });
  var f = jr;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return f.DebUpdater;
  } });
  var c = Br;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return c.PacmanUpdater;
  } });
  var u = Hr;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return u.RpmUpdater;
  } });
  var h = qr;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return h.MacUpdater;
  } });
  var m = Gr;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return m.NsisUpdater;
  } }), r(Tt, e);
  let w;
  function y() {
    if (process.platform === "win32")
      w = new Gr.NsisUpdater();
    else if (process.platform === "darwin")
      w = new qr.MacUpdater();
    else {
      w = new Mr.AppImageUpdater();
      try {
        const _ = i.join(process.resourcesPath, "package-type");
        if (!(0, n.existsSync)(_))
          return w;
        console.info("Checking for beta autoupdate feature for deb/rpm distributions");
        const A = (0, n.readFileSync)(_).toString().trim();
        switch (console.info("Found package-type:", A), A) {
          case "deb":
            w = new jr.DebUpdater();
            break;
          case "rpm":
            w = new Hr.RpmUpdater();
            break;
          case "pacman":
            w = new Br.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (_) {
        console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", _.message);
      }
    }
    return w;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => w || y()
  });
})(Xe);
var Ln = { exports: {} }, io = { exports: {} }, Gl;
function Pf() {
  return Gl || (Gl = 1, function(e) {
    let t = {};
    try {
      t = require("electron");
    } catch {
    }
    t.ipcRenderer && r(t), e.exports = r;
    function r({ contextBridge: n, ipcRenderer: i }) {
      if (!i)
        return;
      i.on("__ELECTRON_LOG_IPC__", (s, a) => {
        window.postMessage({ cmd: "message", ...a });
      }), i.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((s) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${s.message}`
      )));
      const o = {
        sendToMain(s) {
          try {
            i.send("__ELECTRON_LOG__", s);
          } catch (a) {
            console.error("electronLog.sendToMain ", a, "data:", s), i.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: a == null ? void 0 : a.message, stack: a == null ? void 0 : a.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...s) {
          o.sendToMain({ data: s, level: "info" });
        }
      };
      for (const s of ["error", "warn", "info", "verbose", "debug", "silly"])
        o[s] = (...a) => o.sendToMain({
          data: a,
          level: s
        });
      if (n && process.contextIsolated)
        try {
          n.exposeInMainWorld("__electronLog", o);
        } catch {
        }
      typeof window == "object" ? window.__electronLog = o : __electronLog = o;
    }
  }(io)), io.exports;
}
var oo = { exports: {} }, so, Wl;
function NS() {
  if (Wl) return so;
  Wl = 1, so = e;
  function e(t) {
    return Object.defineProperties(r, {
      defaultLabel: { value: "", writable: !0 },
      labelPadding: { value: !0, writable: !0 },
      maxLabelLength: { value: 0, writable: !0 },
      labelLength: {
        get() {
          switch (typeof r.labelPadding) {
            case "boolean":
              return r.labelPadding ? r.maxLabelLength : 0;
            case "number":
              return r.labelPadding;
            default:
              return 0;
          }
        }
      }
    });
    function r(n) {
      r.maxLabelLength = Math.max(r.maxLabelLength, n.length);
      const i = {};
      for (const o of t.levels)
        i[o] = (...s) => t.logData(s, { level: o, scope: n });
      return i.log = i.info, i;
    }
  }
  return so;
}
var ao, Vl;
function PS() {
  if (Vl) return ao;
  Vl = 1;
  class e {
    constructor({ processMessage: r }) {
      this.processMessage = r, this.buffer = [], this.enabled = !1, this.begin = this.begin.bind(this), this.commit = this.commit.bind(this), this.reject = this.reject.bind(this);
    }
    addMessage(r) {
      this.buffer.push(r);
    }
    begin() {
      this.enabled = [];
    }
    commit() {
      this.enabled = !1, this.buffer.forEach((r) => this.processMessage(r)), this.buffer = [];
    }
    reject() {
      this.enabled = !1, this.buffer = [];
    }
  }
  return ao = e, ao;
}
var lo, zl;
function Df() {
  if (zl) return lo;
  zl = 1;
  const e = NS(), t = PS(), n = class n {
    constructor({
      allowUnknownLevel: o = !1,
      dependencies: s = {},
      errorHandler: a,
      eventLogger: l,
      initializeFn: f,
      isDev: c = !1,
      levels: u = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId: h,
      transportFactories: m = {},
      variables: w
    } = {}) {
      V(this, "dependencies", {});
      V(this, "errorHandler", null);
      V(this, "eventLogger", null);
      V(this, "functions", {});
      V(this, "hooks", []);
      V(this, "isDev", !1);
      V(this, "levels", null);
      V(this, "logId", null);
      V(this, "scope", null);
      V(this, "transports", {});
      V(this, "variables", {});
      this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = o, this.buffering = new t(this), this.dependencies = s, this.initializeFn = f, this.isDev = c, this.levels = u, this.logId = h, this.scope = e(this), this.transportFactories = m, this.variables = w || {};
      for (const y of this.levels)
        this.addLevel(y, !1);
      this.log = this.info, this.functions.log = this.log, this.errorHandler = a, a == null || a.setOptions({ ...s, logFn: this.error }), this.eventLogger = l, l == null || l.setOptions({ ...s, logger: this });
      for (const [y, _] of Object.entries(m))
        this.transports[y] = _(this, s);
      n.instances[h] = this;
    }
    static getInstance({ logId: o }) {
      return this.instances[o] || this.instances.default;
    }
    addLevel(o, s = this.levels.length) {
      s !== !1 && this.levels.splice(s, 0, o), this[o] = (...a) => this.logData(a, { level: o }), this.functions[o] = this[o];
    }
    catchErrors(o) {
      return this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      ), this.errorHandler.startCatching(o);
    }
    create(o) {
      return typeof o == "string" && (o = { logId: o }), new n({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...o
      });
    }
    compareLevels(o, s, a = this.levels) {
      const l = a.indexOf(o), f = a.indexOf(s);
      return f === -1 || l === -1 ? !0 : f <= l;
    }
    initialize(o = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...o });
    }
    logData(o, s = {}) {
      this.buffering.enabled ? this.buffering.addMessage({ data: o, date: /* @__PURE__ */ new Date(), ...s }) : this.processMessage({ data: o, ...s });
    }
    processMessage(o, { transports: s = this.transports } = {}) {
      if (o.cmd === "errorHandler") {
        this.errorHandler.handle(o.error, {
          errorName: o.errorName,
          processType: "renderer",
          showDialog: !!o.showDialog
        });
        return;
      }
      let a = o.level;
      this.allowUnknownLevel || (a = this.levels.includes(o.level) ? o.level : "info");
      const l = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...o,
        level: a,
        variables: {
          ...this.variables,
          ...o.variables
        }
      };
      for (const [f, c] of this.transportEntries(s))
        if (!(typeof c != "function" || c.level === !1) && this.compareLevels(c.level, o.level))
          try {
            const u = this.hooks.reduce((h, m) => h && m(h, c, f), l);
            u && c({ ...u, data: [...u.data] });
          } catch (u) {
            this.processInternalErrorFn(u);
          }
    }
    processInternalErrorFn(o) {
    }
    transportEntries(o = this.transports) {
      return (Array.isArray(o) ? o : Object.entries(o)).map((a) => {
        switch (typeof a) {
          case "string":
            return this.transports[a] ? [a, this.transports[a]] : null;
          case "function":
            return [a.name, a];
          default:
            return Array.isArray(a) ? a : null;
        }
      }).filter(Boolean);
    }
  };
  V(n, "instances", {});
  let r = n;
  return lo = r, lo;
}
var co, Yl;
function DS() {
  if (Yl) return co;
  Yl = 1;
  const e = console.error;
  class t {
    constructor({ logFn: n = null } = {}) {
      V(this, "logFn", null);
      V(this, "onError", null);
      V(this, "showDialog", !1);
      V(this, "preventDefault", !0);
      this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.startCatching = this.startCatching.bind(this), this.logFn = n;
    }
    handle(n, {
      logFn: i = this.logFn,
      errorName: o = "",
      onError: s = this.onError,
      showDialog: a = this.showDialog
    } = {}) {
      try {
        (s == null ? void 0 : s({ error: n, errorName: o, processType: "renderer" })) !== !1 && i({ error: n, errorName: o, showDialog: a });
      } catch {
        e(n);
      }
    }
    setOptions({ logFn: n, onError: i, preventDefault: o, showDialog: s }) {
      typeof n == "function" && (this.logFn = n), typeof i == "function" && (this.onError = i), typeof o == "boolean" && (this.preventDefault = o), typeof s == "boolean" && (this.showDialog = s);
    }
    startCatching({ onError: n, showDialog: i } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: i }), window.addEventListener("error", (o) => {
        var s;
        this.preventDefault && ((s = o.preventDefault) == null || s.call(o)), this.handleError(o.error || o);
      }), window.addEventListener("unhandledrejection", (o) => {
        var s;
        this.preventDefault && ((s = o.preventDefault) == null || s.call(o)), this.handleRejection(o.reason || o);
      }));
    }
    handleError(n) {
      this.handle(n, { errorName: "Unhandled" });
    }
    handleRejection(n) {
      const i = n instanceof Error ? n : new Error(JSON.stringify(n));
      this.handle(i, { errorName: "Unhandled rejection" });
    }
  }
  return co = t, co;
}
var uo, Xl;
function Bt() {
  if (Xl) return uo;
  Xl = 1, uo = { transform: e };
  function e({
    logger: t,
    message: r,
    transport: n,
    initialData: i = (r == null ? void 0 : r.data) || [],
    transforms: o = n == null ? void 0 : n.transforms
  }) {
    return o.reduce((s, a) => typeof a == "function" ? a({ data: s, logger: t, message: r, transport: n }) : s, i);
  }
  return uo;
}
var fo, Jl;
function FS() {
  if (Jl) return fo;
  Jl = 1;
  const { transform: e } = Bt();
  fo = r;
  const t = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  function r(i) {
    return Object.assign(o, {
      format: "{h}:{i}:{s}.{ms}{scope} › {text}",
      transforms: [n],
      writeFn({ message: { level: s, data: a } }) {
        const l = t[s] || t.info;
        setTimeout(() => l(...a));
      }
    });
    function o(s) {
      o.writeFn({
        message: { ...s, data: e({ logger: i, message: s, transport: o }) }
      });
    }
  }
  function n({
    data: i = [],
    logger: o = {},
    message: s = {},
    transport: a = {}
  }) {
    if (typeof a.format == "function")
      return a.format({
        data: i,
        level: (s == null ? void 0 : s.level) || "info",
        logger: o,
        message: s,
        transport: a
      });
    if (typeof a.format != "string")
      return i;
    i.unshift(a.format), typeof i[1] == "string" && i[1].match(/%[1cdfiOos]/) && (i = [`${i[0]}${i[1]}`, ...i.slice(2)]);
    const l = s.date || /* @__PURE__ */ new Date();
    return i[0] = i[0].replace(/\{(\w+)}/g, (f, c) => {
      var u, h;
      switch (c) {
        case "level":
          return s.level;
        case "logId":
          return s.logId;
        case "scope": {
          const m = s.scope || ((u = o.scope) == null ? void 0 : u.defaultLabel);
          return m ? ` (${m})` : "";
        }
        case "text":
          return "";
        case "y":
          return l.getFullYear().toString(10);
        case "m":
          return (l.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return l.getDate().toString(10).padStart(2, "0");
        case "h":
          return l.getHours().toString(10).padStart(2, "0");
        case "i":
          return l.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return l.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return l.getMilliseconds().toString(10).padStart(3, "0");
        case "iso":
          return l.toISOString();
        default:
          return ((h = s.variables) == null ? void 0 : h[c]) || f;
      }
    }).trim(), i;
  }
  return fo;
}
var ho, Kl;
function LS() {
  if (Kl) return ho;
  Kl = 1;
  const { transform: e } = Bt();
  ho = r;
  const t = /* @__PURE__ */ new Set([Promise, WeakMap, WeakSet]);
  function r(o) {
    return Object.assign(s, {
      depth: 5,
      transforms: [i]
    });
    function s(a) {
      if (!window.__electronLog) {
        o.processMessage(
          {
            data: ["electron-log: logger isn't initialized in the main process"],
            level: "error"
          },
          { transports: ["console"] }
        );
        return;
      }
      try {
        const l = e({
          initialData: a,
          logger: o,
          message: a,
          transport: s
        });
        __electronLog.sendToMain(l);
      } catch (l) {
        o.transports.console({
          data: ["electronLog.transports.ipc", l, "data:", a.data],
          level: "error"
        });
      }
    }
  }
  function n(o) {
    return Object(o) !== o;
  }
  function i({
    data: o,
    depth: s,
    seen: a = /* @__PURE__ */ new WeakSet(),
    transport: l = {}
  } = {}) {
    const f = s || l.depth || 5;
    return a.has(o) ? "[Circular]" : f < 1 ? n(o) ? o : Array.isArray(o) ? "[Array]" : `[${typeof o}]` : ["function", "symbol"].includes(typeof o) ? o.toString() : n(o) ? o : t.has(o.constructor) ? `[${o.constructor.name}]` : Array.isArray(o) ? o.map((c) => i({
      data: c,
      depth: f - 1,
      seen: a
    })) : o instanceof Date ? o.toISOString() : o instanceof Error ? o.stack : o instanceof Map ? new Map(
      Array.from(o).map(([c, u]) => [
        i({ data: c, depth: f - 1, seen: a }),
        i({ data: u, depth: f - 1, seen: a })
      ])
    ) : o instanceof Set ? new Set(
      Array.from(o).map(
        (c) => i({ data: c, depth: f - 1, seen: a })
      )
    ) : (a.add(o), Object.fromEntries(
      Object.entries(o).map(
        ([c, u]) => [
          c,
          i({ data: u, depth: f - 1, seen: a })
        ]
      )
    ));
  }
  return ho;
}
var Ql;
function xS() {
  return Ql || (Ql = 1, function(e) {
    const t = Df(), r = DS(), n = FS(), i = LS();
    typeof process == "object" && process.type === "browser" && console.warn(
      "electron-log/renderer is loaded in the main process. It could cause unexpected behaviour."
    ), e.exports = o(), e.exports.Logger = t, e.exports.default = e.exports;
    function o() {
      const s = new t({
        allowUnknownLevel: !0,
        errorHandler: new r(),
        initializeFn: () => {
        },
        logId: "default",
        transportFactories: {
          console: n,
          ipc: i
        },
        variables: {
          processType: "renderer"
        }
      });
      return s.errorHandler.setOptions({
        logFn({ error: a, errorName: l, showDialog: f }) {
          s.transports.console({
            data: [l, a].filter(Boolean),
            level: "error"
          }), s.transports.ipc({
            cmd: "errorHandler",
            error: {
              cause: a == null ? void 0 : a.cause,
              code: a == null ? void 0 : a.code,
              name: a == null ? void 0 : a.name,
              message: a == null ? void 0 : a.message,
              stack: a == null ? void 0 : a.stack
            },
            errorName: l,
            logId: s.logId,
            showDialog: f
          });
        }
      }), typeof window == "object" && window.addEventListener("message", (a) => {
        const { cmd: l, logId: f, ...c } = a.data || {}, u = t.getInstance({ logId: f });
        l === "message" && u.processMessage(c, { transports: ["console"] });
      }), new Proxy(s, {
        get(a, l) {
          return typeof a[l] < "u" ? a[l] : (...f) => s.logData(f, { level: l });
        }
      });
    }
  }(oo)), oo.exports;
}
var po, Zl;
function US() {
  if (Zl) return po;
  Zl = 1;
  const e = Le, t = K;
  po = {
    findAndReadPackageJson: r,
    tryReadJsonAt: n
  };
  function r() {
    return n(s()) || n(o()) || n(process.resourcesPath, "app.asar") || n(process.resourcesPath, "app") || n(process.cwd()) || { name: void 0, version: void 0 };
  }
  function n(...a) {
    if (a[0])
      try {
        const l = t.join(...a), f = i("package.json", l);
        if (!f)
          return;
        const c = JSON.parse(e.readFileSync(f, "utf8")), u = (c == null ? void 0 : c.productName) || (c == null ? void 0 : c.name);
        return !u || u.toLowerCase() === "electron" ? void 0 : u ? { name: u, version: c == null ? void 0 : c.version } : void 0;
      } catch {
        return;
      }
  }
  function i(a, l) {
    let f = l;
    for (; ; ) {
      const c = t.parse(f), u = c.root, h = c.dir;
      if (e.existsSync(t.join(f, a)))
        return t.resolve(t.join(f, a));
      if (f === u)
        return null;
      f = h;
    }
  }
  function o() {
    const a = process.argv.filter((f) => f.indexOf("--user-data-dir=") === 0);
    return a.length === 0 || typeof a[0] != "string" ? null : a[0].replace("--user-data-dir=", "");
  }
  function s() {
    var a;
    try {
      return (a = require.main) == null ? void 0 : a.filename;
    } catch {
      return;
    }
  }
  return po;
}
var mo, ec;
function Ff() {
  if (ec) return mo;
  ec = 1;
  const e = Vr, t = St, r = K, n = US();
  class i {
    constructor() {
      V(this, "appName");
      V(this, "appPackageJson");
      V(this, "platform", process.platform);
    }
    getAppLogPath(s = this.getAppName()) {
      return this.platform === "darwin" ? r.join(this.getSystemPathHome(), "Library/Logs", s) : r.join(this.getAppUserDataPath(s), "logs");
    }
    getAppName() {
      var a;
      const s = this.appName || ((a = this.getAppPackageJson()) == null ? void 0 : a.name);
      if (!s)
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      return s;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      return typeof this.appPackageJson != "object" && (this.appPackageJson = n.findAndReadPackageJson()), this.appPackageJson;
    }
    getAppUserDataPath(s = this.getAppName()) {
      return s ? r.join(this.getSystemPathAppData(), s) : void 0;
    }
    getAppVersion() {
      var s;
      return (s = this.getAppPackageJson()) == null ? void 0 : s.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const s = Number(t.release().split(".")[0]);
      return s <= 19 ? `10.${s - 4}` : s - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let s = t.type().replace("_", " "), a = t.release();
      return s === "Darwin" && (s = "macOS", a = this.getMacOsVersion()), `${s} ${a}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const s = this.getAppName(), a = this.getAppVersion(), l = this;
      return {
        appData: this.getSystemPathAppData(),
        appName: s,
        appVersion: a,
        get electronDefaultDir() {
          return l.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(s),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(s)
      };
    }
    getSystemPathAppData() {
      const s = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin":
          return r.join(s, "Library/Application Support");
        case "win32":
          return process.env.APPDATA || r.join(s, "AppData/Roaming");
        default:
          return process.env.XDG_CONFIG_HOME || r.join(s, ".config");
      }
    }
    getSystemPathHome() {
      var s;
      return ((s = t.homedir) == null ? void 0 : s.call(t)) || process.env.HOME;
    }
    getSystemPathTemp() {
      return t.tmpdir();
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: void 0,
        os: this.getOsVersion()
      };
    }
    isDev() {
      return process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "1";
    }
    isElectron() {
      return !!process.versions.electron;
    }
    onAppEvent(s, a) {
    }
    onAppReady(s) {
      s();
    }
    onEveryWebContentsEvent(s, a) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(s, a) {
    }
    onIpcInvoke(s, a) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(s, a = console.error) {
      const f = { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] || "xdg-open";
      e.exec(`${f} ${s}`, {}, (c) => {
        c && a(c);
      });
    }
    setAppName(s) {
      this.appName = s;
    }
    setPlatform(s) {
      this.platform = s;
    }
    setPreloadFileForSessions({
      filePath: s,
      // eslint-disable-line no-unused-vars
      includeFutureSession: a = !0,
      // eslint-disable-line no-unused-vars
      getSessions: l = () => []
      // eslint-disable-line no-unused-vars
    }) {
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(s, a) {
    }
    showErrorBox(s, a) {
    }
  }
  return mo = i, mo;
}
var go, tc;
function kS() {
  if (tc) return go;
  tc = 1;
  const e = K, t = Ff();
  class r extends t {
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron: o } = {}) {
      super();
      /**
       * @type {typeof Electron}
       */
      V(this, "electron");
      this.electron = o;
    }
    getAppName() {
      var s, a;
      let o;
      try {
        o = this.appName || ((s = this.electron.app) == null ? void 0 : s.name) || ((a = this.electron.app) == null ? void 0 : a.getName());
      } catch {
      }
      return o || super.getAppName();
    }
    getAppUserDataPath(o) {
      return this.getPath("userData") || super.getAppUserDataPath(o);
    }
    getAppVersion() {
      var s;
      let o;
      try {
        o = (s = this.electron.app) == null ? void 0 : s.getVersion();
      } catch {
      }
      return o || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(o) {
      var s;
      try {
        return (s = this.electron.app) == null ? void 0 : s.getPath(o);
      } catch {
        return;
      }
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: `Electron ${process.versions.electron}`,
        os: this.getOsVersion()
      };
    }
    getSystemPathAppData() {
      return this.getPath("appData") || super.getSystemPathAppData();
    }
    isDev() {
      var o;
      return ((o = this.electron.app) == null ? void 0 : o.isPackaged) !== void 0 ? !this.electron.app.isPackaged : typeof process.execPath == "string" ? e.basename(process.execPath).toLowerCase().startsWith("electron") : super.isDev();
    }
    onAppEvent(o, s) {
      var a;
      return (a = this.electron.app) == null || a.on(o, s), () => {
        var l;
        (l = this.electron.app) == null || l.off(o, s);
      };
    }
    onAppReady(o) {
      var s, a, l;
      (s = this.electron.app) != null && s.isReady() ? o() : (a = this.electron.app) != null && a.once ? (l = this.electron.app) == null || l.once("ready", o) : o();
    }
    onEveryWebContentsEvent(o, s) {
      var l, f, c;
      return (f = (l = this.electron.webContents) == null ? void 0 : l.getAllWebContents()) == null || f.forEach((u) => {
        u.on(o, s);
      }), (c = this.electron.app) == null || c.on("web-contents-created", a), () => {
        var u, h;
        (u = this.electron.webContents) == null || u.getAllWebContents().forEach((m) => {
          m.off(o, s);
        }), (h = this.electron.app) == null || h.off("web-contents-created", a);
      };
      function a(u, h) {
        h.on(o, s);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(o, s) {
      var a;
      (a = this.electron.ipcMain) == null || a.on(o, s);
    }
    onIpcInvoke(o, s) {
      var a, l;
      (l = (a = this.electron.ipcMain) == null ? void 0 : a.handle) == null || l.call(a, o, s);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(o, s = console.error) {
      var a;
      (a = this.electron.shell) == null || a.openExternal(o).catch(s);
    }
    setPreloadFileForSessions({
      filePath: o,
      includeFutureSession: s = !0,
      getSessions: a = () => {
        var l;
        return [(l = this.electron.session) == null ? void 0 : l.defaultSession];
      }
    }) {
      for (const f of a().filter(Boolean))
        l(f);
      s && this.onAppEvent("session-created", (f) => {
        l(f);
      });
      function l(f) {
        typeof f.registerPreloadScript == "function" ? f.registerPreloadScript({
          filePath: o,
          id: "electron-log-preload",
          type: "frame"
        }) : f.setPreloads([...f.getPreloads(), o]);
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(o, s) {
      var a, l;
      (l = (a = this.electron.BrowserWindow) == null ? void 0 : a.getAllWindows()) == null || l.forEach((f) => {
        var c, u;
        ((c = f.webContents) == null ? void 0 : c.isDestroyed()) === !1 && ((u = f.webContents) == null ? void 0 : u.isCrashed()) === !1 && f.webContents.send(o, s);
      });
    }
    showErrorBox(o, s) {
      var a;
      (a = this.electron.dialog) == null || a.showErrorBox(o, s);
    }
  }
  return go = r, go;
}
var Eo, rc;
function MS() {
  if (rc) return Eo;
  rc = 1;
  const e = Le, t = St, r = K, n = Pf();
  Eo = {
    initialize({
      externalApi: s,
      getSessions: a,
      includeFutureSession: l,
      logger: f,
      preload: c = !0,
      spyRendererConsole: u = !1
    }) {
      s.onAppReady(() => {
        try {
          c && i({
            externalApi: s,
            getSessions: a,
            includeFutureSession: l,
            preloadOption: c
          }), u && o({ externalApi: s, logger: f });
        } catch (h) {
          f.warn(h);
        }
      });
    }
  };
  function i({
    externalApi: s,
    getSessions: a,
    includeFutureSession: l,
    preloadOption: f
  }) {
    let c = typeof f == "string" ? f : void 0;
    try {
      c = r.resolve(
        __dirname,
        "../renderer/electron-log-preload.js"
      );
    } catch {
    }
    if (!c || !e.existsSync(c)) {
      c = r.join(
        s.getAppUserDataPath() || t.tmpdir(),
        "electron-log-preload.js"
      );
      const u = `
      try {
        (${n.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
      e.writeFileSync(c, u, "utf8");
    }
    s.setPreloadFileForSessions({
      filePath: c,
      includeFutureSession: l,
      getSessions: a
    });
  }
  function o({ externalApi: s, logger: a }) {
    const l = ["debug", "info", "warn", "error"];
    s.onEveryWebContentsEvent(
      "console-message",
      (f, c, u) => {
        a.processMessage({
          data: [u],
          level: l[c],
          variables: { processType: "renderer" }
        });
      }
    );
  }
  return Eo;
}
var yo, nc;
function jS() {
  if (nc) return yo;
  nc = 1;
  class e {
    constructor({
      externalApi: n,
      logFn: i = void 0,
      onError: o = void 0,
      showDialog: s = void 0
    } = {}) {
      V(this, "externalApi");
      V(this, "isActive", !1);
      V(this, "logFn");
      V(this, "onError");
      V(this, "showDialog", !0);
      this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({ externalApi: n, logFn: i, onError: o, showDialog: s }), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
    }
    handle(n, {
      logFn: i = this.logFn,
      onError: o = this.onError,
      processType: s = "browser",
      showDialog: a = this.showDialog,
      errorName: l = ""
    } = {}) {
      var f;
      n = t(n);
      try {
        if (typeof o == "function") {
          const c = ((f = this.externalApi) == null ? void 0 : f.getVersions()) || {}, u = this.createIssue;
          if (o({
            createIssue: u,
            error: n,
            errorName: l,
            processType: s,
            versions: c
          }) === !1)
            return;
        }
        l ? i(l, n) : i(n), a && !l.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${s} process`,
          n.stack
        );
      } catch {
        console.error(n);
      }
    }
    setOptions({ externalApi: n, logFn: i, onError: o, showDialog: s }) {
      typeof n == "object" && (this.externalApi = n), typeof i == "function" && (this.logFn = i), typeof o == "function" && (this.onError = o), typeof s == "boolean" && (this.showDialog = s);
    }
    startCatching({ onError: n, showDialog: i } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: i }), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
    }
    stopCatching() {
      this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(n, i) {
      var o;
      (o = this.externalApi) == null || o.openUrl(
        `${n}?${new URLSearchParams(i).toString()}`
      );
    }
    handleError(n) {
      this.handle(n, { errorName: "Unhandled" });
    }
    handleRejection(n) {
      const i = n instanceof Error ? n : new Error(JSON.stringify(n));
      this.handle(i, { errorName: "Unhandled rejection" });
    }
  }
  function t(r) {
    if (r instanceof Error)
      return r;
    if (r && typeof r == "object") {
      if (r.message)
        return Object.assign(new Error(r.message), r);
      try {
        return new Error(JSON.stringify(r));
      } catch (n) {
        return new Error(`Couldn't normalize error ${String(r)}: ${n}`);
      }
    }
    return new Error(`Can't normalize error ${String(r)}`);
  }
  return yo = e, yo;
}
var vo, ic;
function BS() {
  if (ic) return vo;
  ic = 1;
  class e {
    constructor(r = {}) {
      V(this, "disposers", []);
      V(this, "format", "{eventSource}#{eventName}:");
      V(this, "formatters", {
        app: {
          "certificate-error": ({ args: r }) => this.arrayToObject(r.slice(1, 4), [
            "url",
            "error",
            "certificate"
          ]),
          "child-process-gone": ({ args: r }) => r.length === 1 ? r[0] : r,
          "render-process-gone": ({ args: [r, n] }) => n && typeof n == "object" ? { ...n, ...this.getWebContentsDetails(r) } : []
        },
        webContents: {
          "console-message": ({ args: [r, n, i, o] }) => {
            if (!(r < 3))
              return { message: n, source: `${o}:${i}` };
          },
          "did-fail-load": ({ args: r }) => this.arrayToObject(r, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]),
          "did-fail-provisional-load": ({ args: r }) => this.arrayToObject(r, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]),
          "plugin-crashed": ({ args: r }) => this.arrayToObject(r, ["name", "version"]),
          "preload-error": ({ args: r }) => this.arrayToObject(r, ["preloadPath", "error"])
        }
      });
      V(this, "events", {
        app: {
          "certificate-error": !0,
          "child-process-gone": !0,
          "render-process-gone": !0
        },
        webContents: {
          // 'console-message': true,
          "did-fail-load": !0,
          "did-fail-provisional-load": !0,
          "plugin-crashed": !0,
          "preload-error": !0,
          unresponsive: !0
        }
      });
      V(this, "externalApi");
      V(this, "level", "error");
      V(this, "scope", "");
      this.setOptions(r);
    }
    setOptions({
      events: r,
      externalApi: n,
      level: i,
      logger: o,
      format: s,
      formatters: a,
      scope: l
    }) {
      typeof r == "object" && (this.events = r), typeof n == "object" && (this.externalApi = n), typeof i == "string" && (this.level = i), typeof o == "object" && (this.logger = o), (typeof s == "string" || typeof s == "function") && (this.format = s), typeof a == "object" && (this.formatters = a), typeof l == "string" && (this.scope = l);
    }
    startLogging(r = {}) {
      this.setOptions(r), this.disposeListeners();
      for (const n of this.getEventNames(this.events.app))
        this.disposers.push(
          this.externalApi.onAppEvent(n, (...i) => {
            this.handleEvent({ eventSource: "app", eventName: n, handlerArgs: i });
          })
        );
      for (const n of this.getEventNames(this.events.webContents))
        this.disposers.push(
          this.externalApi.onEveryWebContentsEvent(
            n,
            (...i) => {
              this.handleEvent(
                { eventSource: "webContents", eventName: n, handlerArgs: i }
              );
            }
          )
        );
    }
    stopLogging() {
      this.disposeListeners();
    }
    arrayToObject(r, n) {
      const i = {};
      return n.forEach((o, s) => {
        i[o] = r[s];
      }), r.length > n.length && (i.unknownArgs = r.slice(n.length)), i;
    }
    disposeListeners() {
      this.disposers.forEach((r) => r()), this.disposers = [];
    }
    formatEventLog({ eventName: r, eventSource: n, handlerArgs: i }) {
      var u;
      const [o, ...s] = i;
      if (typeof this.format == "function")
        return this.format({ args: s, event: o, eventName: r, eventSource: n });
      const a = (u = this.formatters[n]) == null ? void 0 : u[r];
      let l = s;
      if (typeof a == "function" && (l = a({ args: s, event: o, eventName: r, eventSource: n })), !l)
        return;
      const f = {};
      return Array.isArray(l) ? f.args = l : typeof l == "object" && Object.assign(f, l), n === "webContents" && Object.assign(f, this.getWebContentsDetails(o == null ? void 0 : o.sender)), [this.format.replace("{eventSource}", n === "app" ? "App" : "WebContents").replace("{eventName}", r), f];
    }
    getEventNames(r) {
      return !r || typeof r != "object" ? [] : Object.entries(r).filter(([n, i]) => i).map(([n]) => n);
    }
    getWebContentsDetails(r) {
      if (!(r != null && r.loadURL))
        return {};
      try {
        return {
          webContents: {
            id: r.id,
            url: r.getURL()
          }
        };
      } catch {
        return {};
      }
    }
    handleEvent({ eventName: r, eventSource: n, handlerArgs: i }) {
      var s;
      const o = this.formatEventLog({ eventName: r, eventSource: n, handlerArgs: i });
      if (o) {
        const a = this.scope ? this.logger.scope(this.scope) : this.logger;
        (s = a == null ? void 0 : a[this.level]) == null || s.call(a, ...o);
      }
    }
  }
  return vo = e, vo;
}
var wo, oc;
function Lf() {
  if (oc) return wo;
  oc = 1;
  const { transform: e } = Bt();
  wo = {
    concatFirstStringElements: t,
    formatScope: n,
    formatText: o,
    formatVariables: i,
    timeZoneFromOffset: r,
    format({ message: s, logger: a, transport: l, data: f = s == null ? void 0 : s.data }) {
      switch (typeof l.format) {
        case "string":
          return e({
            message: s,
            logger: a,
            transforms: [i, n, o],
            transport: l,
            initialData: [l.format, ...f]
          });
        case "function":
          return l.format({
            data: f,
            level: (s == null ? void 0 : s.level) || "info",
            logger: a,
            message: s,
            transport: l
          });
        default:
          return f;
      }
    }
  };
  function t({ data: s }) {
    return typeof s[0] != "string" || typeof s[1] != "string" || s[0].match(/%[1cdfiOos]/) ? s : [`${s[0]} ${s[1]}`, ...s.slice(2)];
  }
  function r(s) {
    const a = Math.abs(s), l = s > 0 ? "-" : "+", f = Math.floor(a / 60).toString().padStart(2, "0"), c = (a % 60).toString().padStart(2, "0");
    return `${l}${f}:${c}`;
  }
  function n({ data: s, logger: a, message: l }) {
    const { defaultLabel: f, labelLength: c } = (a == null ? void 0 : a.scope) || {}, u = s[0];
    let h = l.scope;
    h || (h = f);
    let m;
    return h === "" ? m = c > 0 ? "".padEnd(c + 3) : "" : typeof h == "string" ? m = ` (${h})`.padEnd(c + 3) : m = "", s[0] = u.replace("{scope}", m), s;
  }
  function i({ data: s, message: a }) {
    let l = s[0];
    if (typeof l != "string")
      return s;
    l = l.replace("{level}]", `${a.level}]`.padEnd(6, " "));
    const f = a.date || /* @__PURE__ */ new Date();
    return s[0] = l.replace(/\{(\w+)}/g, (c, u) => {
      var h;
      switch (u) {
        case "level":
          return a.level || "info";
        case "logId":
          return a.logId;
        case "y":
          return f.getFullYear().toString(10);
        case "m":
          return (f.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return f.getDate().toString(10).padStart(2, "0");
        case "h":
          return f.getHours().toString(10).padStart(2, "0");
        case "i":
          return f.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return f.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return f.getMilliseconds().toString(10).padStart(3, "0");
        case "z":
          return r(f.getTimezoneOffset());
        case "iso":
          return f.toISOString();
        default:
          return ((h = a.variables) == null ? void 0 : h[u]) || c;
      }
    }).trim(), s;
  }
  function o({ data: s }) {
    const a = s[0];
    if (typeof a != "string")
      return s;
    if (a.lastIndexOf("{text}") === a.length - 6)
      return s[0] = a.replace(/\s?{text}/, ""), s[0] === "" && s.shift(), s;
    const f = a.split("{text}");
    let c = [];
    return f[0] !== "" && c.push(f[0]), c = c.concat(s.slice(1)), f[1] !== "" && c.push(f[1]), c;
  }
  return wo;
}
var _o = { exports: {} }, sc;
function vi() {
  return sc || (sc = 1, function(e) {
    const t = Xn;
    e.exports = {
      serialize: n,
      maxDepth({ data: i, transport: o, depth: s = (o == null ? void 0 : o.depth) ?? 6 }) {
        if (!i)
          return i;
        if (s < 1)
          return Array.isArray(i) ? "[array]" : typeof i == "object" && i ? "[object]" : i;
        if (Array.isArray(i))
          return i.map((l) => e.exports.maxDepth({
            data: l,
            depth: s - 1
          }));
        if (typeof i != "object" || i && typeof i.toISOString == "function")
          return i;
        if (i === null)
          return null;
        if (i instanceof Error)
          return i;
        const a = {};
        for (const l in i)
          Object.prototype.hasOwnProperty.call(i, l) && (a[l] = e.exports.maxDepth({
            data: i[l],
            depth: s - 1
          }));
        return a;
      },
      toJSON({ data: i }) {
        return JSON.parse(JSON.stringify(i, r()));
      },
      toString({ data: i, transport: o }) {
        const s = (o == null ? void 0 : o.inspectOptions) || {}, a = i.map((l) => {
          if (l !== void 0)
            try {
              const f = JSON.stringify(l, r(), "  ");
              return f === void 0 ? void 0 : JSON.parse(f);
            } catch {
              return l;
            }
        });
        return t.formatWithOptions(s, ...a);
      }
    };
    function r(i = {}) {
      const o = /* @__PURE__ */ new WeakSet();
      return function(s, a) {
        if (typeof a == "object" && a !== null) {
          if (o.has(a))
            return;
          o.add(a);
        }
        return n(s, a, i);
      };
    }
    function n(i, o, s = {}) {
      const a = (s == null ? void 0 : s.serializeMapAndSet) !== !1;
      return o instanceof Error ? o.stack : o && (typeof o == "function" ? `[function] ${o.toString()}` : o instanceof Date ? o.toISOString() : a && o instanceof Map && Object.fromEntries ? Object.fromEntries(o) : a && o instanceof Set && Array.from ? Array.from(o) : o);
    }
  }(_o)), _o.exports;
}
var So, ac;
function Rs() {
  if (ac) return So;
  ac = 1, So = {
    transformStyles: n,
    applyAnsiStyles({ data: i }) {
      return n(i, t, r);
    },
    removeStyles({ data: i }) {
      return n(i, () => "");
    }
  };
  const e = {
    unset: "\x1B[0m",
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m"
  };
  function t(i) {
    const o = i.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return e[o] || "";
  }
  function r(i) {
    return i + e.unset;
  }
  function n(i, o, s) {
    const a = {};
    return i.reduce((l, f, c, u) => {
      if (a[c])
        return l;
      if (typeof f == "string") {
        let h = c, m = !1;
        f = f.replace(/%[1cdfiOos]/g, (w) => {
          if (h += 1, w !== "%c")
            return w;
          const y = u[h];
          return typeof y == "string" ? (a[h] = !0, m = !0, o(y, f)) : w;
        }), m && s && (f = s(f));
      }
      return l.push(f), l;
    }, []);
  }
  return So;
}
var Ao, lc;
function HS() {
  if (lc) return Ao;
  lc = 1;
  const {
    concatFirstStringElements: e,
    format: t
  } = Lf(), { maxDepth: r, toJSON: n } = vi(), {
    applyAnsiStyles: i,
    removeStyles: o
  } = Rs(), { transform: s } = Bt(), a = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  Ao = c;
  const f = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
  Object.assign(c, {
    DEFAULT_FORMAT: f
  });
  function c(y) {
    return Object.assign(_, {
      format: f,
      level: "silly",
      transforms: [
        u,
        t,
        m,
        e,
        r,
        n
      ],
      useStyles: process.env.FORCE_STYLES,
      writeFn({ message: A }) {
        (a[A.level] || a.info)(...A.data);
      }
    });
    function _(A) {
      const T = s({ logger: y, message: A, transport: _ });
      _.writeFn({
        message: { ...A, data: T }
      });
    }
  }
  function u({ data: y, message: _, transport: A }) {
    return typeof A.format != "string" || !A.format.includes("%c") ? y : [`color:${w(_.level)}`, "color:unset", ...y];
  }
  function h(y, _) {
    if (typeof y == "boolean")
      return y;
    const T = _ === "error" || _ === "warn" ? process.stderr : process.stdout;
    return T && T.isTTY;
  }
  function m(y) {
    const { message: _, transport: A } = y;
    return (h(A.useStyles, _.level) ? i : o)(y);
  }
  function w(y) {
    const _ = { error: "red", warn: "yellow", info: "cyan", default: "unset" };
    return _[y] || _.default;
  }
  return Ao;
}
var To, cc;
function xf() {
  if (cc) return To;
  cc = 1;
  const e = Jn, t = Le, r = St;
  class n extends e {
    constructor({
      path: a,
      writeOptions: l = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync: f = !1
    }) {
      super();
      V(this, "asyncWriteQueue", []);
      V(this, "bytesWritten", 0);
      V(this, "hasActiveAsyncWriting", !1);
      V(this, "path", null);
      V(this, "initialSize");
      V(this, "writeOptions", null);
      V(this, "writeAsync", !1);
      this.path = a, this.writeOptions = l, this.writeAsync = f;
    }
    get size() {
      return this.getSize();
    }
    clear() {
      try {
        return t.writeFileSync(this.path, "", {
          mode: this.writeOptions.mode,
          flag: "w"
        }), this.reset(), !0;
      } catch (a) {
        return a.code === "ENOENT" ? !0 : (this.emit("error", a, this), !1);
      }
    }
    crop(a) {
      try {
        const l = i(this.path, a || 4096);
        this.clear(), this.writeLine(`[log cropped]${r.EOL}${l}`);
      } catch (l) {
        this.emit(
          "error",
          new Error(`Couldn't crop file ${this.path}. ${l.message}`),
          this
        );
      }
    }
    getSize() {
      if (this.initialSize === void 0)
        try {
          const a = t.statSync(this.path);
          this.initialSize = a.size;
        } catch {
          this.initialSize = 0;
        }
      return this.initialSize + this.bytesWritten;
    }
    increaseBytesWrittenCounter(a) {
      this.bytesWritten += Buffer.byteLength(a, this.writeOptions.encoding);
    }
    isNull() {
      return !1;
    }
    nextAsyncWrite() {
      const a = this;
      if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0)
        return;
      const l = this.asyncWriteQueue.join("");
      this.asyncWriteQueue = [], this.hasActiveAsyncWriting = !0, t.writeFile(this.path, l, this.writeOptions, (f) => {
        a.hasActiveAsyncWriting = !1, f ? a.emit(
          "error",
          new Error(`Couldn't write to ${a.path}. ${f.message}`),
          this
        ) : a.increaseBytesWrittenCounter(l), a.nextAsyncWrite();
      });
    }
    reset() {
      this.initialSize = void 0, this.bytesWritten = 0;
    }
    toString() {
      return this.path;
    }
    writeLine(a) {
      if (a += r.EOL, this.writeAsync) {
        this.asyncWriteQueue.push(a), this.nextAsyncWrite();
        return;
      }
      try {
        t.writeFileSync(this.path, a, this.writeOptions), this.increaseBytesWrittenCounter(a);
      } catch (l) {
        this.emit(
          "error",
          new Error(`Couldn't write to ${this.path}. ${l.message}`),
          this
        );
      }
    }
  }
  To = n;
  function i(o, s) {
    const a = Buffer.alloc(s), l = t.statSync(o), f = Math.min(l.size, s), c = Math.max(0, l.size - s), u = t.openSync(o, "r"), h = t.readSync(u, a, 0, f, c);
    return t.closeSync(u), a.toString("utf8", 0, h);
  }
  return To;
}
var bo, uc;
function qS() {
  if (uc) return bo;
  uc = 1;
  const e = xf();
  class t extends e {
    clear() {
    }
    crop() {
    }
    getSize() {
      return 0;
    }
    isNull() {
      return !0;
    }
    writeLine() {
    }
  }
  return bo = t, bo;
}
var Co, fc;
function GS() {
  if (fc) return Co;
  fc = 1;
  const e = Jn, t = Le, r = K, n = xf(), i = qS();
  class o extends e {
    constructor() {
      super();
      V(this, "store", {});
      this.emitError = this.emitError.bind(this);
    }
    /**
     * Provide a File object corresponding to the filePath
     * @param {string} filePath
     * @param {WriteOptions} [writeOptions]
     * @param {boolean} [writeAsync]
     * @return {File}
     */
    provide({ filePath: l, writeOptions: f = {}, writeAsync: c = !1 }) {
      let u;
      try {
        if (l = r.resolve(l), this.store[l])
          return this.store[l];
        u = this.createFile({ filePath: l, writeOptions: f, writeAsync: c });
      } catch (h) {
        u = new i({ path: l }), this.emitError(h, u);
      }
      return u.on("error", this.emitError), this.store[l] = u, u;
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @param {boolean} async
     * @return {File}
     * @private
     */
    createFile({ filePath: l, writeOptions: f, writeAsync: c }) {
      return this.testFileWriting({ filePath: l, writeOptions: f }), new n({ path: l, writeOptions: f, writeAsync: c });
    }
    /**
     * @param {Error} error
     * @param {File} file
     * @private
     */
    emitError(l, f) {
      this.emit("error", l, f);
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @private
     */
    testFileWriting({ filePath: l, writeOptions: f }) {
      t.mkdirSync(r.dirname(l), { recursive: !0 }), t.writeFileSync(l, "", { flag: "a", mode: f.mode });
    }
  }
  return Co = o, Co;
}
var Oo, dc;
function WS() {
  if (dc) return Oo;
  dc = 1;
  const e = Le, t = St, r = K, n = GS(), { transform: i } = Bt(), { removeStyles: o } = Rs(), {
    format: s,
    concatFirstStringElements: a
  } = Lf(), { toString: l } = vi();
  Oo = c;
  const f = new n();
  function c(h, { registry: m = f, externalApi: w } = {}) {
    let y;
    return m.listenerCount("error") < 1 && m.on("error", (B, H) => {
      T(`Can't write to ${H}`, B);
    }), Object.assign(_, {
      fileName: u(h.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: P,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: L,
      sync: !0,
      transforms: [o, s, a, l],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(B) {
        const H = B.toString(), j = r.parse(H);
        try {
          e.renameSync(H, r.join(j.dir, `${j.name}.old${j.ext}`));
        } catch (ae) {
          T("Could not rotate log", ae);
          const E = Math.round(_.maxSize / 4);
          B.crop(Math.min(E, 256 * 1024));
        }
      },
      resolvePathFn(B) {
        return r.join(B.libraryDefaultDir, B.fileName);
      },
      setAppName(B) {
        h.dependencies.externalApi.setAppName(B);
      }
    });
    function _(B) {
      const H = P(B);
      _.maxSize > 0 && H.size > _.maxSize && (_.archiveLogFn(H), H.reset());
      const ae = i({ logger: h, message: B, transport: _ });
      H.writeLine(ae);
    }
    function A() {
      y || (y = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            w.getPathVariables()
          ),
          fileName: {
            get() {
              return _.fileName;
            },
            enumerable: !0
          }
        }
      ), typeof _.archiveLog == "function" && (_.archiveLogFn = _.archiveLog, T("archiveLog is deprecated. Use archiveLogFn instead")), typeof _.resolvePath == "function" && (_.resolvePathFn = _.resolvePath, T("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function T(B, H = null, j = "error") {
      const ae = [`electron-log.transports.file: ${B}`];
      H && ae.push(H), h.transports.console({ data: ae, date: /* @__PURE__ */ new Date(), level: j });
    }
    function P(B) {
      A();
      const H = _.resolvePathFn(y, B);
      return m.provide({
        filePath: H,
        writeAsync: !_.sync,
        writeOptions: _.writeOptions
      });
    }
    function L({ fileFilter: B = (H) => H.endsWith(".log") } = {}) {
      A();
      const H = r.dirname(_.resolvePathFn(y));
      return e.existsSync(H) ? e.readdirSync(H).map((j) => r.join(H, j)).filter(B).map((j) => {
        try {
          return {
            path: j,
            lines: e.readFileSync(j, "utf8").split(t.EOL)
          };
        } catch {
          return null;
        }
      }).filter(Boolean) : [];
    }
  }
  function u(h = process.type) {
    switch (h) {
      case "renderer":
        return "renderer.log";
      case "worker":
        return "worker.log";
      default:
        return "main.log";
    }
  }
  return Oo;
}
var $o, hc;
function VS() {
  if (hc) return $o;
  hc = 1;
  const { maxDepth: e, toJSON: t } = vi(), { transform: r } = Bt();
  $o = n;
  function n(i, { externalApi: o }) {
    return Object.assign(s, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: i.isDev ? "silly" : !1,
      transforms: [t, e]
    }), o != null && o.isElectron() ? s : void 0;
    function s(a) {
      var l;
      ((l = a == null ? void 0 : a.variables) == null ? void 0 : l.processType) !== "renderer" && (o == null || o.sendIpc(s.eventId, {
        ...a,
        data: r({ logger: i, message: a, transport: s })
      }));
    }
  }
  return $o;
}
var Ro, pc;
function zS() {
  if (pc) return Ro;
  pc = 1;
  const e = Ac, t = zd, { transform: r } = Bt(), { removeStyles: n } = Rs(), { toJSON: i, maxDepth: o } = vi();
  Ro = s;
  function s(a) {
    return Object.assign(l, {
      client: { name: "electron-application" },
      depth: 6,
      level: !1,
      requestOptions: {},
      transforms: [n, i, o],
      makeBodyFn({ message: f }) {
        return JSON.stringify({
          client: l.client,
          data: f.data,
          date: f.date.getTime(),
          level: f.level,
          scope: f.scope,
          variables: f.variables
        });
      },
      processErrorFn({ error: f }) {
        a.processMessage(
          {
            data: [`electron-log: can't POST ${l.url}`, f],
            level: "warn"
          },
          { transports: ["console", "file"] }
        );
      },
      sendRequestFn({ serverUrl: f, requestOptions: c, body: u }) {
        const m = (f.startsWith("https:") ? t : e).request(f, {
          method: "POST",
          ...c,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": u.length,
            ...c.headers
          }
        });
        return m.write(u), m.end(), m;
      }
    });
    function l(f) {
      if (!l.url)
        return;
      const c = l.makeBodyFn({
        logger: a,
        message: { ...f, data: r({ logger: a, message: f, transport: l }) },
        transport: l
      }), u = l.sendRequestFn({
        serverUrl: l.url,
        requestOptions: l.requestOptions,
        body: Buffer.from(c, "utf8")
      });
      u.on("error", (h) => l.processErrorFn({
        error: h,
        logger: a,
        message: f,
        request: u,
        transport: l
      }));
    }
  }
  return Ro;
}
var Io, mc;
function Uf() {
  if (mc) return Io;
  mc = 1;
  const e = Df(), t = jS(), r = BS(), n = HS(), i = WS(), o = VS(), s = zS();
  Io = a;
  function a({ dependencies: l, initializeFn: f }) {
    var u;
    const c = new e({
      dependencies: l,
      errorHandler: new t(),
      eventLogger: new r(),
      initializeFn: f,
      isDev: (u = l.externalApi) == null ? void 0 : u.isDev(),
      logId: "default",
      transportFactories: {
        console: n,
        file: i,
        ipc: o,
        remote: s
      },
      variables: {
        processType: "main"
      }
    });
    return c.default = c, c.Logger = e, c.processInternalErrorFn = (h) => {
      c.transports.console.writeFn({
        message: {
          data: ["Unhandled electron-log error", h],
          level: "error"
        }
      });
    }, c;
  }
  return Io;
}
var No, gc;
function YS() {
  if (gc) return No;
  gc = 1;
  const e = gt, t = kS(), { initialize: r } = MS(), n = Uf(), i = new t({ electron: e }), o = n({
    dependencies: { externalApi: i },
    initializeFn: r
  });
  No = o, i.onIpc("__ELECTRON_LOG__", (a, l) => {
    l.scope && o.Logger.getInstance(l).scope(l.scope);
    const f = new Date(l.date);
    s({
      ...l,
      date: f.getTime() ? f : /* @__PURE__ */ new Date()
    });
  }), i.onIpcInvoke("__ELECTRON_LOG__", (a, { cmd: l = "", logId: f }) => {
    switch (l) {
      case "getOptions":
        return {
          levels: o.Logger.getInstance({ logId: f }).levels,
          logId: f
        };
      default:
        return s({ data: [`Unknown cmd '${l}'`], level: "error" }), {};
    }
  });
  function s(a) {
    var l;
    (l = o.Logger.getInstance(a)) == null || l.processMessage(a);
  }
  return No;
}
var Po, Ec;
function XS() {
  if (Ec) return Po;
  Ec = 1;
  const e = Ff(), t = Uf(), r = new e();
  return Po = t({
    dependencies: { externalApi: r }
  }), Po;
}
const JS = typeof process > "u" || process.type === "renderer" || process.type === "worker", KS = typeof process == "object" && process.type === "browser";
JS ? (Pf(), Ln.exports = xS()) : KS ? Ln.exports = YS() : Ln.exports = XS();
var QS = Ln.exports;
const He = /* @__PURE__ */ lh(QS);
vc(import.meta.url);
const ZS = Gd(import.meta.url), Xo = Ke.dirname(ZS);
process.env.APP_ROOT = Ke.join(Xo, "..");
const xn = process.env.VITE_DEV_SERVER_URL, _A = Ke.join(process.env.APP_ROOT, "dist-electron"), Jo = Ke.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = xn ? Ke.join(process.env.APP_ROOT, "public") : Jo;
let ut;
function kf() {
  ut = new yc({
    icon: Ke.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: Ke.join(Xo, "preload.mjs")
    }
  }), console.log(Ke.join(Xo, "preload.mjs")), ut.webContents.on("did-finish-load", () => {
    ut == null || ut.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), xn ? (ut.loadURL(xn), console.log("VITE_DEV_SERVER_URL: ", xn)) : (ut.loadFile(Ke.join(Jo, "index.html")), console.log("RENDERER_DIST: ", Ke.join(Jo, "index.html")));
}
Rr.on("window-all-closed", () => {
  process.platform !== "darwin" && (Rr.quit(), ut = null);
});
Rr.on("activate", () => {
  yc.getAllWindows().length === 0 && kf();
});
Rr.whenReady().then(() => {
  kf(), Xe.autoUpdater.logger = He, He.info("App starting..."), Xe.autoUpdater.checkForUpdates(), Xe.autoUpdater.on("checking-for-update", () => {
    He.info("Checking for update...");
  }), Xe.autoUpdater.on("update-available", (e) => {
    He.info("Update available.", e);
  }), Xe.autoUpdater.on("update-not-available", (e) => {
    He.info("Update not available.", e);
  }), Xe.autoUpdater.on("error", (e) => {
    He.error("Error in auto-updater:", e);
  }), Xe.autoUpdater.on("download-progress", (e) => {
    He.info(`Download speed: ${e.bytesPerSecond}`), He.info(`Downloaded ${e.percent}%`), He.info(`${e.transferred}/${e.total}`);
  }), Xe.autoUpdater.on("update-downloaded", (e) => {
    He.info("Update downloaded. Will install on quit."), He.info(e.version);
  }), Pe.on("log", (e, ...t) => {
    console.log("\x1B[32m%s\x1B[0m", "[Renderer Log]:", ...t);
  }), Pe.handle("open-file", async (e, t) => await qd.openPath(t)), Pe.handle("database:insert-client", (e, t) => (console.log(Xe.autoUpdater.currentVersion), Jd(t))), Pe.handle("database:get-all-clients", () => Kd()), Pe.handle("database:update-client-field", (e, t, r, n) => Qd(t, r, n)), Pe.handle("database:delete-client", (e, t) => Zd(t)), Pe.handle("database:insert-case", (e, t) => eh(t)), Pe.handle("database:get-all-cases", () => th()), Pe.handle("database:delete-case", (e, t) => nh(t)), Pe.handle("database:update-case", (e, t, r, n) => rh(t, r, n)), Pe.handle("database:insert-task", (e, t) => ih(t)), Pe.handle("database:get-all-tasks", () => oh()), Pe.handle("database:delete-task", (e, t) => sh(t)), Pe.handle("database:update-task", (e, t) => ah(t));
});
export {
  _A as MAIN_DIST,
  Jo as RENDERER_DIST,
  xn as VITE_DEV_SERVER_URL
};
