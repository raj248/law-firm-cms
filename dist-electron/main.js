var Qd = Object.defineProperty;
var Zd = (e, t, r) => t in e ? Qd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var W = (e, t, r) => Zd(e, typeof t != "symbol" ? t + "" : t, r);
import vt, { app as Dr, BrowserWindow as Ac, ipcMain as Z, shell as eh } from "electron";
import { createRequire as bc } from "node:module";
import Q from "path";
import Re from "fs";
import { fileURLToPath as th } from "node:url";
import Je from "node:path";
import rh from "constants";
import Xr from "stream";
import Qn from "util";
import Oc from "assert";
import Kr from "child_process";
import Zn from "events";
import ur from "crypto";
import Cc from "tty";
import ot from "os";
import fr from "url";
import nh from "string_decoder";
import Nc from "zlib";
import Ic from "http";
import ih from "https";
import { randomUUID as Rc } from "node:crypto";
const oh = bc(import.meta.url), sh = oh("better-sqlite3");
console.log("App Name : ", Dr.getName());
const ts = Q.join("./database", "lawfirm.db");
console.log("Databse Path : ", ts);
Re.mkdirSync(Q.dirname(ts), { recursive: !0 });
const K = new sh(ts);
K.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    address TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL,
    court TEXT NOT NULL,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
    );
    
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    dueDate TEXT, -- ISO date (nullable if no due date)
    time TEXT, -- optional time
    client_id TEXT NOT NULL,
    caseId TEXT NOT NULL,
    note TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL DEFAULT 'Open',
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS courts (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

`);
const ah = (e) => {
  if (K.prepare("SELECT 1 FROM clients WHERE phone = ? OR email = ?").get(e.phone, e.email))
    return { success: !1, error: "Client with same phone or email already exists." };
  const r = K.prepare(`
    INSERT INTO clients 
    (id, name, phone, email, address, updated_at, created_at, note, is_synced) 
    VALUES (@id, @name, @phone, @email, @address, @updated_at, @created_at, @note, @is_synced)
  `), n = (/* @__PURE__ */ new Date()).toISOString(), i = {
    id: e.id,
    name: e.name,
    phone: e.phone,
    email: e.email,
    address: e.address ?? "",
    updated_at: n,
    created_at: n,
    note: e.note ?? "",
    is_synced: 0
  };
  return r.run(i).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0, data: i };
}, lh = () => K.prepare("SELECT * FROM clients").all(), ch = (e, t, r) => {
  if (!["name", "email", "phone", "address", "note"].includes(t)) return !1;
  const i = K.prepare(`UPDATE clients SET ${t} = ?,  is_synced = 0 WHERE id = ?`).run(r, e);
  return console.log("inside Client repo"), i.changes === 0 ? { success: !1, error: "Update Failed: No idea what happend." } : { success: !0 };
}, uh = (e) => K.prepare("DELETE FROM clients WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, fh = () => K.prepare(`
    SELECT * FROM clients WHERE is_synced = 0
  `).all(), dh = (e) => K.prepare(`
    UPDATE clients SET is_synced = 1 WHERE id = ?
  `).run(e), hh = (e) => {
  const t = K.prepare(`
    INSERT INTO clients (id, name, phone, email, address, note, created_at, updated_at, is_synced)
    VALUES (@id, @name, @phone, @email, @address, @note, @created_at, @updated_at, 1)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      phone = excluded.phone,
      email = excluded.email,
      address = excluded.address,
      note = excluded.note,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      is_synced = 1
  `);
  K.transaction(() => {
    for (const n of e) t.run(n);
  })();
}, ph = (e) => {
  if (K.prepare("SELECT 1 FROM cases WHERE id = ?").get(e.id))
    return { success: !1, error: "Case with same CaseID already exists." };
  const r = K.prepare(`
    INSERT INTO cases
    (id, title, description, status, client_id, court, created_at, tags, updated_at, is_synced)
    VALUES (@id, @title, @description, @status, @client_id, @court, @created_at, @tags, @updated_at, @is_synced)
  `), n = {
    ...e,
    tags: JSON.stringify(e.tags ?? []),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: 0
  };
  return r.run(n).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0, data: { ...n, tags: e.tags ?? [] } };
}, mh = () => K.prepare("SELECT * FROM cases").all(), gh = (e, t, r) => {
  if (!K.prepare("SELECT 1 FROM cases WHERE id = ?").get(e)) return { success: !1, error: "Case not found" };
  const i = t === "tags", o = (/* @__PURE__ */ new Date()).toISOString();
  if (!K.prepare(`
    UPDATE cases
    SET ${t} = ?, updated_at = ?, is_synced = 0
    WHERE id = ?
  `).run(
    i ? JSON.stringify(r) : r,
    o,
    e
  ).changes) return { success: !1, error: "Update failed: No idea what happend." };
  const l = K.prepare("SELECT * FROM cases WHERE id = ?").get(e);
  return { success: !0, updatedCase: ((c) => ({
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : []
  }))(l) };
}, Eh = (e) => K.prepare("DELETE FROM cases WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, yh = () => K.prepare(`
    SELECT * FROM cases WHERE is_synced = 0
  `).all(), vh = (e) => K.prepare(`
    UPDATE cases SET is_synced = 1 WHERE id = ?
  `).run(e), wh = (e) => {
  const t = K.prepare(`
    INSERT INTO cases (id, title, description, status, client_id, court, tags, created_at, updated_at, is_synced)
    VALUES (@id, @title, @description, @status, @client_id, @court, @tags, @created_at, @updated_at, 1)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      client_id = excluded.client_id,
      court = excluded.court,
      tags = excluded.tags,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      is_synced = 1
  `);
  K.transaction(() => {
    for (const n of e) t.run({
      ...n,
      client_id: n.client_id,
      tags: n.tags ?? ""
      // store tags as JSON string
    });
  })();
}, _h = (e) => {
  const t = K.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, dueDate, time, client_id, caseId, status, priority, note, updated_at, created_at, is_synced)
    VALUES (@id, @title, @dueDate, @time, @client_id, @caseId, @status, @priority, @note, @updated_at, @created_at, @is_synced)
  `), r = (/* @__PURE__ */ new Date()).toISOString();
  return t.run({
    ...e,
    note: e.note ?? "",
    updated_at: r,
    created_at: r,
    is_synced: 0
  }).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0 };
}, Th = () => K.prepare("SELECT * FROM tasks").all(), Sh = (e) => K.prepare("DELETE FROM tasks WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, Ah = (e) => K.prepare(`
    UPDATE tasks
    SET 
      title = @title,
      dueDate = @dueDate,
      time = @time,
      client_id = @client_id,
      caseId = @caseId,
      note = @note,
      status = @status,
      priority = @priority,
      updated_at = @updated_at,
      is_synced = @is_synced,
    WHERE id = @id
  `).run({
  ...e,
  note: e.note ?? "",
  updated_at: (/* @__PURE__ */ new Date()).toISOString(),
  is_synced: 0
}).changes === 0 ? { success: !1, error: "Update failed: No such task found (or i have no idea what happend)." } : { success: !0 };
var Ce = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function $c(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var rt = {}, Bt = {}, $e = {};
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
var dt = rh, bh = process.cwd, Fn = null, Oh = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return Fn || (Fn = bh.call(process)), Fn;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var Zs = process.chdir;
  process.chdir = function(e) {
    Fn = null, Zs.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, Zs);
}
var Ch = Nh;
function Nh(e) {
  dt.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || r(e), e.chown = o(e.chown), e.fchown = o(e.fchown), e.lchown = o(e.lchown), e.chmod = n(e.chmod), e.fchmod = n(e.fchmod), e.lchmod = n(e.lchmod), e.chownSync = s(e.chownSync), e.fchownSync = s(e.fchownSync), e.lchownSync = s(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = a(e.stat), e.fstat = a(e.fstat), e.lstat = a(e.lstat), e.statSync = l(e.statSync), e.fstatSync = l(e.fstatSync), e.lstatSync = l(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(c, u, h) {
    h && process.nextTick(h);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(c, u, h, m) {
    m && process.nextTick(m);
  }, e.lchownSync = function() {
  }), Oh === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(c) {
    function u(h, m, w) {
      var y = Date.now(), _ = 0;
      c(h, m, function S(A) {
        if (A && (A.code === "EACCES" || A.code === "EPERM" || A.code === "EBUSY") && Date.now() - y < 6e4) {
          setTimeout(function() {
            e.stat(m, function(D, L) {
              D && D.code === "ENOENT" ? c(h, m, S) : w(A);
            });
          }, _), _ < 100 && (_ += 10);
          return;
        }
        w && w(A);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(c) {
    function u(h, m, w, y, _, S) {
      var A;
      if (S && typeof S == "function") {
        var D = 0;
        A = function(L, j, H) {
          if (L && L.code === "EAGAIN" && D < 10)
            return D++, c.call(e, h, m, w, y, _, A);
          S.apply(this, arguments);
        };
      }
      return c.call(e, h, m, w, y, _, A);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(c) {
    return function(u, h, m, w, y) {
      for (var _ = 0; ; )
        try {
          return c.call(e, u, h, m, w, y);
        } catch (S) {
          if (S.code === "EAGAIN" && _ < 10) {
            _++;
            continue;
          }
          throw S;
        }
    };
  }(e.readSync);
  function t(c) {
    c.lchmod = function(u, h, m) {
      c.open(
        u,
        dt.O_WRONLY | dt.O_SYMLINK,
        h,
        function(w, y) {
          if (w) {
            m && m(w);
            return;
          }
          c.fchmod(y, h, function(_) {
            c.close(y, function(S) {
              m && m(_ || S);
            });
          });
        }
      );
    }, c.lchmodSync = function(u, h) {
      var m = c.openSync(u, dt.O_WRONLY | dt.O_SYMLINK, h), w = !0, y;
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
    dt.hasOwnProperty("O_SYMLINK") && c.futimes ? (c.lutimes = function(u, h, m, w) {
      c.open(u, dt.O_SYMLINK, function(y, _) {
        if (y) {
          w && w(y);
          return;
        }
        c.futimes(_, h, m, function(S) {
          c.close(_, function(A) {
            w && w(S || A);
          });
        });
      });
    }, c.lutimesSync = function(u, h, m) {
      var w = c.openSync(u, dt.O_SYMLINK), y, _ = !0;
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
var ea = Xr.Stream, Ih = Rh;
function Rh(e) {
  return {
    ReadStream: t,
    WriteStream: r
  };
  function t(n, i) {
    if (!(this instanceof t)) return new t(n, i);
    ea.call(this);
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
    ea.call(this), this.path = n, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
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
var $h = Ph, Dh = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function Ph(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: Dh(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(r) {
    Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
  }), t;
}
var se = Re, Fh = Ch, Lh = Ih, xh = $h, yn = Qn, we, Bn;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (we = Symbol.for("graceful-fs.queue"), Bn = Symbol.for("graceful-fs.previous")) : (we = "___graceful-fs.queue", Bn = "___graceful-fs.previous");
function Uh() {
}
function Dc(e, t) {
  Object.defineProperty(e, we, {
    get: function() {
      return t;
    }
  });
}
var Ut = Uh;
yn.debuglog ? Ut = yn.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Ut = function() {
  var e = yn.format.apply(yn, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!se[we]) {
  var kh = Ce[we] || [];
  Dc(se, kh), se.close = function(e) {
    function t(r, n) {
      return e.call(se, r, function(i) {
        i || ta(), typeof n == "function" && n.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, Bn, {
      value: e
    }), t;
  }(se.close), se.closeSync = function(e) {
    function t(r) {
      e.apply(se, arguments), ta();
    }
    return Object.defineProperty(t, Bn, {
      value: e
    }), t;
  }(se.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    Ut(se[we]), Oc.equal(se[we].length, 0);
  });
}
Ce[we] || Dc(Ce, se[we]);
var De = rs(xh(se));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !se.__patched && (De = rs(se), se.__patched = !0);
function rs(e) {
  Fh(e), e.gracefulify = rs, e.createReadStream = j, e.createWriteStream = H;
  var t = e.readFile;
  e.readFile = r;
  function r(E, Y, q) {
    return typeof Y == "function" && (q = Y, Y = null), M(E, Y, q);
    function M(ee, I, C, $) {
      return t(ee, I, function(O) {
        O && (O.code === "EMFILE" || O.code === "ENFILE") ? Vt([M, [ee, I, C], O, $ || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var n = e.writeFile;
  e.writeFile = i;
  function i(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = null), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return n(I, C, $, function(R) {
        R && (R.code === "EMFILE" || R.code === "ENFILE") ? Vt([ee, [I, C, $, O], R, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var o = e.appendFile;
  o && (e.appendFile = s);
  function s(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = null), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return o(I, C, $, function(R) {
        R && (R.code === "EMFILE" || R.code === "ENFILE") ? Vt([ee, [I, C, $, O], R, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var a = e.copyFile;
  a && (e.copyFile = l);
  function l(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = 0), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return a(I, C, $, function(R) {
        R && (R.code === "EMFILE" || R.code === "ENFILE") ? Vt([ee, [I, C, $, O], R, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var f = e.readdir;
  e.readdir = u;
  var c = /^v[0-5]\./;
  function u(E, Y, q) {
    typeof Y == "function" && (q = Y, Y = null);
    var M = c.test(process.version) ? function(C, $, O, P) {
      return f(C, ee(
        C,
        $,
        O,
        P
      ));
    } : function(C, $, O, P) {
      return f(C, $, ee(
        C,
        $,
        O,
        P
      ));
    };
    return M(E, Y, q);
    function ee(I, C, $, O) {
      return function(P, R) {
        P && (P.code === "EMFILE" || P.code === "ENFILE") ? Vt([
          M,
          [I, C, $],
          P,
          O || Date.now(),
          Date.now()
        ]) : (R && R.sort && R.sort(), typeof $ == "function" && $.call(this, P, R));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var h = Lh(e);
    S = h.ReadStream, D = h.WriteStream;
  }
  var m = e.ReadStream;
  m && (S.prototype = Object.create(m.prototype), S.prototype.open = A);
  var w = e.WriteStream;
  w && (D.prototype = Object.create(w.prototype), D.prototype.open = L), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return S;
    },
    set: function(E) {
      S = E;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return D;
    },
    set: function(E) {
      D = E;
    },
    enumerable: !0,
    configurable: !0
  });
  var y = S;
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
  var _ = D;
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
  function S(E, Y) {
    return this instanceof S ? (m.apply(this, arguments), this) : S.apply(Object.create(S.prototype), arguments);
  }
  function A() {
    var E = this;
    ce(E.path, E.flags, E.mode, function(Y, q) {
      Y ? (E.autoClose && E.destroy(), E.emit("error", Y)) : (E.fd = q, E.emit("open", q), E.read());
    });
  }
  function D(E, Y) {
    return this instanceof D ? (w.apply(this, arguments), this) : D.apply(Object.create(D.prototype), arguments);
  }
  function L() {
    var E = this;
    ce(E.path, E.flags, E.mode, function(Y, q) {
      Y ? (E.destroy(), E.emit("error", Y)) : (E.fd = q, E.emit("open", q));
    });
  }
  function j(E, Y) {
    return new e.ReadStream(E, Y);
  }
  function H(E, Y) {
    return new e.WriteStream(E, Y);
  }
  var B = e.open;
  e.open = ce;
  function ce(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = null), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return B(I, C, $, function(R, k) {
        R && (R.code === "EMFILE" || R.code === "ENFILE") ? Vt([ee, [I, C, $, O], R, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  return e;
}
function Vt(e) {
  Ut("ENQUEUE", e[0].name, e[1]), se[we].push(e), ns();
}
var vn;
function ta() {
  for (var e = Date.now(), t = 0; t < se[we].length; ++t)
    se[we][t].length > 2 && (se[we][t][3] = e, se[we][t][4] = e);
  ns();
}
function ns() {
  if (clearTimeout(vn), vn = void 0, se[we].length !== 0) {
    var e = se[we].shift(), t = e[0], r = e[1], n = e[2], i = e[3], o = e[4];
    if (i === void 0)
      Ut("RETRY", t.name, r), t.apply(null, r);
    else if (Date.now() - i >= 6e4) {
      Ut("TIMEOUT", t.name, r);
      var s = r.pop();
      typeof s == "function" && s.call(null, n);
    } else {
      var a = Date.now() - o, l = Math.max(o - i, 1), f = Math.min(l * 1.2, 100);
      a >= f ? (Ut("RETRY", t.name, r), t.apply(null, r.concat([i]))) : se[we].push(e);
    }
    vn === void 0 && (vn = setTimeout(ns, 0));
  }
}
(function(e) {
  const t = $e.fromCallback, r = De, n = [
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
})(Bt);
var is = {}, Pc = {};
const Mh = Q;
Pc.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(Mh.parse(t).root, ""))) {
    const n = new Error(`Path contains invalid characters: ${t}`);
    throw n.code = "EINVAL", n;
  }
};
const Fc = Bt, { checkPath: Lc } = Pc, xc = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
is.makeDir = async (e, t) => (Lc(e), Fc.mkdir(e, {
  mode: xc(t),
  recursive: !0
}));
is.makeDirSync = (e, t) => (Lc(e), Fc.mkdirSync(e, {
  mode: xc(t),
  recursive: !0
}));
const Bh = $e.fromPromise, { makeDir: jh, makeDirSync: $i } = is, Di = Bh(jh);
var Ze = {
  mkdirs: Di,
  mkdirsSync: $i,
  // alias
  mkdirp: Di,
  mkdirpSync: $i,
  ensureDir: Di,
  ensureDirSync: $i
};
const Hh = $e.fromPromise, Uc = Bt;
function qh(e) {
  return Uc.access(e).then(() => !0).catch(() => !1);
}
var jt = {
  pathExists: Hh(qh),
  pathExistsSync: Uc.existsSync
};
const ir = De;
function Gh(e, t, r, n) {
  ir.open(e, "r+", (i, o) => {
    if (i) return n(i);
    ir.futimes(o, t, r, (s) => {
      ir.close(o, (a) => {
        n && n(s || a);
      });
    });
  });
}
function Vh(e, t, r) {
  const n = ir.openSync(e, "r+");
  return ir.futimesSync(n, t, r), ir.closeSync(n);
}
var kc = {
  utimesMillis: Gh,
  utimesMillisSync: Vh
};
const sr = Bt, ge = Q, Wh = Qn;
function Yh(e, t, r) {
  const n = r.dereference ? (i) => sr.stat(i, { bigint: !0 }) : (i) => sr.lstat(i, { bigint: !0 });
  return Promise.all([
    n(e),
    n(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, o]) => ({ srcStat: i, destStat: o }));
}
function zh(e, t, r) {
  let n;
  const i = r.dereference ? (s) => sr.statSync(s, { bigint: !0 }) : (s) => sr.lstatSync(s, { bigint: !0 }), o = i(e);
  try {
    n = i(t);
  } catch (s) {
    if (s.code === "ENOENT") return { srcStat: o, destStat: null };
    throw s;
  }
  return { srcStat: o, destStat: n };
}
function Xh(e, t, r, n, i) {
  Wh.callbackify(Yh)(e, t, n, (o, s) => {
    if (o) return i(o);
    const { srcStat: a, destStat: l } = s;
    if (l) {
      if (Jr(a, l)) {
        const f = ge.basename(e), c = ge.basename(t);
        return r === "move" && f !== c && f.toLowerCase() === c.toLowerCase() ? i(null, { srcStat: a, destStat: l, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (a.isDirectory() && !l.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!a.isDirectory() && l.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return a.isDirectory() && os(e, t) ? i(new Error(ei(e, t, r))) : i(null, { srcStat: a, destStat: l });
  });
}
function Kh(e, t, r, n) {
  const { srcStat: i, destStat: o } = zh(e, t, n);
  if (o) {
    if (Jr(i, o)) {
      const s = ge.basename(e), a = ge.basename(t);
      if (r === "move" && s !== a && s.toLowerCase() === a.toLowerCase())
        return { srcStat: i, destStat: o, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !o.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && o.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && os(e, t))
    throw new Error(ei(e, t, r));
  return { srcStat: i, destStat: o };
}
function Mc(e, t, r, n, i) {
  const o = ge.resolve(ge.dirname(e)), s = ge.resolve(ge.dirname(r));
  if (s === o || s === ge.parse(s).root) return i();
  sr.stat(s, { bigint: !0 }, (a, l) => a ? a.code === "ENOENT" ? i() : i(a) : Jr(t, l) ? i(new Error(ei(e, r, n))) : Mc(e, t, s, n, i));
}
function Bc(e, t, r, n) {
  const i = ge.resolve(ge.dirname(e)), o = ge.resolve(ge.dirname(r));
  if (o === i || o === ge.parse(o).root) return;
  let s;
  try {
    s = sr.statSync(o, { bigint: !0 });
  } catch (a) {
    if (a.code === "ENOENT") return;
    throw a;
  }
  if (Jr(t, s))
    throw new Error(ei(e, r, n));
  return Bc(e, t, o, n);
}
function Jr(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function os(e, t) {
  const r = ge.resolve(e).split(ge.sep).filter((i) => i), n = ge.resolve(t).split(ge.sep).filter((i) => i);
  return r.reduce((i, o, s) => i && n[s] === o, !0);
}
function ei(e, t, r) {
  return `Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`;
}
var dr = {
  checkPaths: Xh,
  checkPathsSync: Kh,
  checkParentPaths: Mc,
  checkParentPathsSync: Bc,
  isSrcSubdir: os,
  areIdentical: Jr
};
const Le = De, Pr = Q, Jh = Ze.mkdirs, Qh = jt.pathExists, Zh = kc.utimesMillis, Fr = dr;
function ep(e, t, r, n) {
  typeof r == "function" && !n ? (n = r, r = {}) : typeof r == "function" && (r = { filter: r }), n = n || function() {
  }, r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Fr.checkPaths(e, t, "copy", r, (i, o) => {
    if (i) return n(i);
    const { srcStat: s, destStat: a } = o;
    Fr.checkParentPaths(e, s, t, "copy", (l) => l ? n(l) : r.filter ? jc(ra, a, e, t, r, n) : ra(a, e, t, r, n));
  });
}
function ra(e, t, r, n, i) {
  const o = Pr.dirname(r);
  Qh(o, (s, a) => {
    if (s) return i(s);
    if (a) return jn(e, t, r, n, i);
    Jh(o, (l) => l ? i(l) : jn(e, t, r, n, i));
  });
}
function jc(e, t, r, n, i, o) {
  Promise.resolve(i.filter(r, n)).then((s) => s ? e(t, r, n, i, o) : o(), (s) => o(s));
}
function tp(e, t, r, n, i) {
  return n.filter ? jc(jn, e, t, r, n, i) : jn(e, t, r, n, i);
}
function jn(e, t, r, n, i) {
  (n.dereference ? Le.stat : Le.lstat)(t, (s, a) => s ? i(s) : a.isDirectory() ? lp(a, e, t, r, n, i) : a.isFile() || a.isCharacterDevice() || a.isBlockDevice() ? rp(a, e, t, r, n, i) : a.isSymbolicLink() ? fp(e, t, r, n, i) : a.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : a.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function rp(e, t, r, n, i, o) {
  return t ? np(e, r, n, i, o) : Hc(e, r, n, i, o);
}
function np(e, t, r, n, i) {
  if (n.overwrite)
    Le.unlink(r, (o) => o ? i(o) : Hc(e, t, r, n, i));
  else return n.errorOnExist ? i(new Error(`'${r}' already exists`)) : i();
}
function Hc(e, t, r, n, i) {
  Le.copyFile(t, r, (o) => o ? i(o) : n.preserveTimestamps ? ip(e.mode, t, r, i) : ti(r, e.mode, i));
}
function ip(e, t, r, n) {
  return op(e) ? sp(r, e, (i) => i ? n(i) : na(e, t, r, n)) : na(e, t, r, n);
}
function op(e) {
  return (e & 128) === 0;
}
function sp(e, t, r) {
  return ti(e, t | 128, r);
}
function na(e, t, r, n) {
  ap(t, r, (i) => i ? n(i) : ti(r, e, n));
}
function ti(e, t, r) {
  return Le.chmod(e, t, r);
}
function ap(e, t, r) {
  Le.stat(e, (n, i) => n ? r(n) : Zh(t, i.atime, i.mtime, r));
}
function lp(e, t, r, n, i, o) {
  return t ? qc(r, n, i, o) : cp(e.mode, r, n, i, o);
}
function cp(e, t, r, n, i) {
  Le.mkdir(r, (o) => {
    if (o) return i(o);
    qc(t, r, n, (s) => s ? i(s) : ti(r, e, i));
  });
}
function qc(e, t, r, n) {
  Le.readdir(e, (i, o) => i ? n(i) : Gc(o, e, t, r, n));
}
function Gc(e, t, r, n, i) {
  const o = e.pop();
  return o ? up(e, o, t, r, n, i) : i();
}
function up(e, t, r, n, i, o) {
  const s = Pr.join(r, t), a = Pr.join(n, t);
  Fr.checkPaths(s, a, "copy", i, (l, f) => {
    if (l) return o(l);
    const { destStat: c } = f;
    tp(c, s, a, i, (u) => u ? o(u) : Gc(e, r, n, i, o));
  });
}
function fp(e, t, r, n, i) {
  Le.readlink(t, (o, s) => {
    if (o) return i(o);
    if (n.dereference && (s = Pr.resolve(process.cwd(), s)), e)
      Le.readlink(r, (a, l) => a ? a.code === "EINVAL" || a.code === "UNKNOWN" ? Le.symlink(s, r, i) : i(a) : (n.dereference && (l = Pr.resolve(process.cwd(), l)), Fr.isSrcSubdir(s, l) ? i(new Error(`Cannot copy '${s}' to a subdirectory of itself, '${l}'.`)) : e.isDirectory() && Fr.isSrcSubdir(l, s) ? i(new Error(`Cannot overwrite '${l}' with '${s}'.`)) : dp(s, r, i)));
    else
      return Le.symlink(s, r, i);
  });
}
function dp(e, t, r) {
  Le.unlink(t, (n) => n ? r(n) : Le.symlink(e, t, r));
}
var hp = ep;
const Ae = De, Lr = Q, pp = Ze.mkdirsSync, mp = kc.utimesMillisSync, xr = dr;
function gp(e, t, r) {
  typeof r == "function" && (r = { filter: r }), r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: n, destStat: i } = xr.checkPathsSync(e, t, "copy", r);
  return xr.checkParentPathsSync(e, n, t, "copy"), Ep(i, e, t, r);
}
function Ep(e, t, r, n) {
  if (n.filter && !n.filter(t, r)) return;
  const i = Lr.dirname(r);
  return Ae.existsSync(i) || pp(i), Vc(e, t, r, n);
}
function yp(e, t, r, n) {
  if (!(n.filter && !n.filter(t, r)))
    return Vc(e, t, r, n);
}
function Vc(e, t, r, n) {
  const o = (n.dereference ? Ae.statSync : Ae.lstatSync)(t);
  if (o.isDirectory()) return bp(o, e, t, r, n);
  if (o.isFile() || o.isCharacterDevice() || o.isBlockDevice()) return vp(o, e, t, r, n);
  if (o.isSymbolicLink()) return Np(e, t, r, n);
  throw o.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : o.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function vp(e, t, r, n, i) {
  return t ? wp(e, r, n, i) : Wc(e, r, n, i);
}
function wp(e, t, r, n) {
  if (n.overwrite)
    return Ae.unlinkSync(r), Wc(e, t, r, n);
  if (n.errorOnExist)
    throw new Error(`'${r}' already exists`);
}
function Wc(e, t, r, n) {
  return Ae.copyFileSync(t, r), n.preserveTimestamps && _p(e.mode, t, r), ss(r, e.mode);
}
function _p(e, t, r) {
  return Tp(e) && Sp(r, e), Ap(t, r);
}
function Tp(e) {
  return (e & 128) === 0;
}
function Sp(e, t) {
  return ss(e, t | 128);
}
function ss(e, t) {
  return Ae.chmodSync(e, t);
}
function Ap(e, t) {
  const r = Ae.statSync(e);
  return mp(t, r.atime, r.mtime);
}
function bp(e, t, r, n, i) {
  return t ? Yc(r, n, i) : Op(e.mode, r, n, i);
}
function Op(e, t, r, n) {
  return Ae.mkdirSync(r), Yc(t, r, n), ss(r, e);
}
function Yc(e, t, r) {
  Ae.readdirSync(e).forEach((n) => Cp(n, e, t, r));
}
function Cp(e, t, r, n) {
  const i = Lr.join(t, e), o = Lr.join(r, e), { destStat: s } = xr.checkPathsSync(i, o, "copy", n);
  return yp(s, i, o, n);
}
function Np(e, t, r, n) {
  let i = Ae.readlinkSync(t);
  if (n.dereference && (i = Lr.resolve(process.cwd(), i)), e) {
    let o;
    try {
      o = Ae.readlinkSync(r);
    } catch (s) {
      if (s.code === "EINVAL" || s.code === "UNKNOWN") return Ae.symlinkSync(i, r);
      throw s;
    }
    if (n.dereference && (o = Lr.resolve(process.cwd(), o)), xr.isSrcSubdir(i, o))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${o}'.`);
    if (Ae.statSync(r).isDirectory() && xr.isSrcSubdir(o, i))
      throw new Error(`Cannot overwrite '${o}' with '${i}'.`);
    return Ip(i, r);
  } else
    return Ae.symlinkSync(i, r);
}
function Ip(e, t) {
  return Ae.unlinkSync(t), Ae.symlinkSync(e, t);
}
var Rp = gp;
const $p = $e.fromCallback;
var as = {
  copy: $p(hp),
  copySync: Rp
};
const ia = De, zc = Q, re = Oc, Ur = process.platform === "win32";
function Xc(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((r) => {
    e[r] = e[r] || ia[r], r = r + "Sync", e[r] = e[r] || ia[r];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function ls(e, t, r) {
  let n = 0;
  typeof t == "function" && (r = t, t = {}), re(e, "rimraf: missing path"), re.strictEqual(typeof e, "string", "rimraf: path should be a string"), re.strictEqual(typeof r, "function", "rimraf: callback function required"), re(t, "rimraf: invalid options argument provided"), re.strictEqual(typeof t, "object", "rimraf: options should be object"), Xc(t), oa(e, t, function i(o) {
    if (o) {
      if ((o.code === "EBUSY" || o.code === "ENOTEMPTY" || o.code === "EPERM") && n < t.maxBusyTries) {
        n++;
        const s = n * 100;
        return setTimeout(() => oa(e, t, i), s);
      }
      o.code === "ENOENT" && (o = null);
    }
    r(o);
  });
}
function oa(e, t, r) {
  re(e), re(t), re(typeof r == "function"), t.lstat(e, (n, i) => {
    if (n && n.code === "ENOENT")
      return r(null);
    if (n && n.code === "EPERM" && Ur)
      return sa(e, t, n, r);
    if (i && i.isDirectory())
      return Ln(e, t, n, r);
    t.unlink(e, (o) => {
      if (o) {
        if (o.code === "ENOENT")
          return r(null);
        if (o.code === "EPERM")
          return Ur ? sa(e, t, o, r) : Ln(e, t, o, r);
        if (o.code === "EISDIR")
          return Ln(e, t, o, r);
      }
      return r(o);
    });
  });
}
function sa(e, t, r, n) {
  re(e), re(t), re(typeof n == "function"), t.chmod(e, 438, (i) => {
    i ? n(i.code === "ENOENT" ? null : r) : t.stat(e, (o, s) => {
      o ? n(o.code === "ENOENT" ? null : r) : s.isDirectory() ? Ln(e, t, r, n) : t.unlink(e, n);
    });
  });
}
function aa(e, t, r) {
  let n;
  re(e), re(t);
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
  n.isDirectory() ? xn(e, t, r) : t.unlinkSync(e);
}
function Ln(e, t, r, n) {
  re(e), re(t), re(typeof n == "function"), t.rmdir(e, (i) => {
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? Dp(e, t, n) : i && i.code === "ENOTDIR" ? n(r) : n(i);
  });
}
function Dp(e, t, r) {
  re(e), re(t), re(typeof r == "function"), t.readdir(e, (n, i) => {
    if (n) return r(n);
    let o = i.length, s;
    if (o === 0) return t.rmdir(e, r);
    i.forEach((a) => {
      ls(zc.join(e, a), t, (l) => {
        if (!s) {
          if (l) return r(s = l);
          --o === 0 && t.rmdir(e, r);
        }
      });
    });
  });
}
function Kc(e, t) {
  let r;
  t = t || {}, Xc(t), re(e, "rimraf: missing path"), re.strictEqual(typeof e, "string", "rimraf: path should be a string"), re(t, "rimraf: missing options"), re.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    r = t.lstatSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    n.code === "EPERM" && Ur && aa(e, t, n);
  }
  try {
    r && r.isDirectory() ? xn(e, t, null) : t.unlinkSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    if (n.code === "EPERM")
      return Ur ? aa(e, t, n) : xn(e, t, n);
    if (n.code !== "EISDIR")
      throw n;
    xn(e, t, n);
  }
}
function xn(e, t, r) {
  re(e), re(t);
  try {
    t.rmdirSync(e);
  } catch (n) {
    if (n.code === "ENOTDIR")
      throw r;
    if (n.code === "ENOTEMPTY" || n.code === "EEXIST" || n.code === "EPERM")
      Pp(e, t);
    else if (n.code !== "ENOENT")
      throw n;
  }
}
function Pp(e, t) {
  if (re(e), re(t), t.readdirSync(e).forEach((r) => Kc(zc.join(e, r), t)), Ur) {
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
var Fp = ls;
ls.sync = Kc;
const Hn = De, Lp = $e.fromCallback, Jc = Fp;
function xp(e, t) {
  if (Hn.rm) return Hn.rm(e, { recursive: !0, force: !0 }, t);
  Jc(e, t);
}
function Up(e) {
  if (Hn.rmSync) return Hn.rmSync(e, { recursive: !0, force: !0 });
  Jc.sync(e);
}
var ri = {
  remove: Lp(xp),
  removeSync: Up
};
const kp = $e.fromPromise, Qc = Bt, Zc = Q, eu = Ze, tu = ri, la = kp(async function(t) {
  let r;
  try {
    r = await Qc.readdir(t);
  } catch {
    return eu.mkdirs(t);
  }
  return Promise.all(r.map((n) => tu.remove(Zc.join(t, n))));
});
function ca(e) {
  let t;
  try {
    t = Qc.readdirSync(e);
  } catch {
    return eu.mkdirsSync(e);
  }
  t.forEach((r) => {
    r = Zc.join(e, r), tu.removeSync(r);
  });
}
var Mp = {
  emptyDirSync: ca,
  emptydirSync: ca,
  emptyDir: la,
  emptydir: la
};
const Bp = $e.fromCallback, ru = Q, gt = De, nu = Ze;
function jp(e, t) {
  function r() {
    gt.writeFile(e, "", (n) => {
      if (n) return t(n);
      t();
    });
  }
  gt.stat(e, (n, i) => {
    if (!n && i.isFile()) return t();
    const o = ru.dirname(e);
    gt.stat(o, (s, a) => {
      if (s)
        return s.code === "ENOENT" ? nu.mkdirs(o, (l) => {
          if (l) return t(l);
          r();
        }) : t(s);
      a.isDirectory() ? r() : gt.readdir(o, (l) => {
        if (l) return t(l);
      });
    });
  });
}
function Hp(e) {
  let t;
  try {
    t = gt.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const r = ru.dirname(e);
  try {
    gt.statSync(r).isDirectory() || gt.readdirSync(r);
  } catch (n) {
    if (n && n.code === "ENOENT") nu.mkdirsSync(r);
    else throw n;
  }
  gt.writeFileSync(e, "");
}
var qp = {
  createFile: Bp(jp),
  createFileSync: Hp
};
const Gp = $e.fromCallback, iu = Q, mt = De, ou = Ze, Vp = jt.pathExists, { areIdentical: su } = dr;
function Wp(e, t, r) {
  function n(i, o) {
    mt.link(i, o, (s) => {
      if (s) return r(s);
      r(null);
    });
  }
  mt.lstat(t, (i, o) => {
    mt.lstat(e, (s, a) => {
      if (s)
        return s.message = s.message.replace("lstat", "ensureLink"), r(s);
      if (o && su(a, o)) return r(null);
      const l = iu.dirname(t);
      Vp(l, (f, c) => {
        if (f) return r(f);
        if (c) return n(e, t);
        ou.mkdirs(l, (u) => {
          if (u) return r(u);
          n(e, t);
        });
      });
    });
  });
}
function Yp(e, t) {
  let r;
  try {
    r = mt.lstatSync(t);
  } catch {
  }
  try {
    const o = mt.lstatSync(e);
    if (r && su(o, r)) return;
  } catch (o) {
    throw o.message = o.message.replace("lstat", "ensureLink"), o;
  }
  const n = iu.dirname(t);
  return mt.existsSync(n) || ou.mkdirsSync(n), mt.linkSync(e, t);
}
var zp = {
  createLink: Gp(Wp),
  createLinkSync: Yp
};
const Et = Q, Nr = De, Xp = jt.pathExists;
function Kp(e, t, r) {
  if (Et.isAbsolute(e))
    return Nr.lstat(e, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), r(n)) : r(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const n = Et.dirname(t), i = Et.join(n, e);
    return Xp(i, (o, s) => o ? r(o) : s ? r(null, {
      toCwd: i,
      toDst: e
    }) : Nr.lstat(e, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), r(a)) : r(null, {
      toCwd: e,
      toDst: Et.relative(n, e)
    })));
  }
}
function Jp(e, t) {
  let r;
  if (Et.isAbsolute(e)) {
    if (r = Nr.existsSync(e), !r) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const n = Et.dirname(t), i = Et.join(n, e);
    if (r = Nr.existsSync(i), r)
      return {
        toCwd: i,
        toDst: e
      };
    if (r = Nr.existsSync(e), !r) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: Et.relative(n, e)
    };
  }
}
var Qp = {
  symlinkPaths: Kp,
  symlinkPathsSync: Jp
};
const au = De;
function Zp(e, t, r) {
  if (r = typeof t == "function" ? t : r, t = typeof t == "function" ? !1 : t, t) return r(null, t);
  au.lstat(e, (n, i) => {
    if (n) return r(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", r(null, t);
  });
}
function em(e, t) {
  let r;
  if (t) return t;
  try {
    r = au.lstatSync(e);
  } catch {
    return "file";
  }
  return r && r.isDirectory() ? "dir" : "file";
}
var tm = {
  symlinkType: Zp,
  symlinkTypeSync: em
};
const rm = $e.fromCallback, lu = Q, Ge = Bt, cu = Ze, nm = cu.mkdirs, im = cu.mkdirsSync, uu = Qp, om = uu.symlinkPaths, sm = uu.symlinkPathsSync, fu = tm, am = fu.symlinkType, lm = fu.symlinkTypeSync, cm = jt.pathExists, { areIdentical: du } = dr;
function um(e, t, r, n) {
  n = typeof r == "function" ? r : n, r = typeof r == "function" ? !1 : r, Ge.lstat(t, (i, o) => {
    !i && o.isSymbolicLink() ? Promise.all([
      Ge.stat(e),
      Ge.stat(t)
    ]).then(([s, a]) => {
      if (du(s, a)) return n(null);
      ua(e, t, r, n);
    }) : ua(e, t, r, n);
  });
}
function ua(e, t, r, n) {
  om(e, t, (i, o) => {
    if (i) return n(i);
    e = o.toDst, am(o.toCwd, r, (s, a) => {
      if (s) return n(s);
      const l = lu.dirname(t);
      cm(l, (f, c) => {
        if (f) return n(f);
        if (c) return Ge.symlink(e, t, a, n);
        nm(l, (u) => {
          if (u) return n(u);
          Ge.symlink(e, t, a, n);
        });
      });
    });
  });
}
function fm(e, t, r) {
  let n;
  try {
    n = Ge.lstatSync(t);
  } catch {
  }
  if (n && n.isSymbolicLink()) {
    const a = Ge.statSync(e), l = Ge.statSync(t);
    if (du(a, l)) return;
  }
  const i = sm(e, t);
  e = i.toDst, r = lm(i.toCwd, r);
  const o = lu.dirname(t);
  return Ge.existsSync(o) || im(o), Ge.symlinkSync(e, t, r);
}
var dm = {
  createSymlink: rm(um),
  createSymlinkSync: fm
};
const { createFile: fa, createFileSync: da } = qp, { createLink: ha, createLinkSync: pa } = zp, { createSymlink: ma, createSymlinkSync: ga } = dm;
var hm = {
  // file
  createFile: fa,
  createFileSync: da,
  ensureFile: fa,
  ensureFileSync: da,
  // link
  createLink: ha,
  createLinkSync: pa,
  ensureLink: ha,
  ensureLinkSync: pa,
  // symlink
  createSymlink: ma,
  createSymlinkSync: ga,
  ensureSymlink: ma,
  ensureSymlinkSync: ga
};
function pm(e, { EOL: t = `
`, finalEOL: r = !0, replacer: n = null, spaces: i } = {}) {
  const o = r ? t : "";
  return JSON.stringify(e, n, i).replace(/\n/g, t) + o;
}
function mm(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var cs = { stringify: pm, stripBom: mm };
let ar;
try {
  ar = De;
} catch {
  ar = Re;
}
const ni = $e, { stringify: hu, stripBom: pu } = cs;
async function gm(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || ar, n = "throws" in t ? t.throws : !0;
  let i = await ni.fromCallback(r.readFile)(e, t);
  i = pu(i);
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
const Em = ni.fromPromise(gm);
function ym(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || ar, n = "throws" in t ? t.throws : !0;
  try {
    let i = r.readFileSync(e, t);
    return i = pu(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (n)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function vm(e, t, r = {}) {
  const n = r.fs || ar, i = hu(t, r);
  await ni.fromCallback(n.writeFile)(e, i, r);
}
const wm = ni.fromPromise(vm);
function _m(e, t, r = {}) {
  const n = r.fs || ar, i = hu(t, r);
  return n.writeFileSync(e, i, r);
}
const Tm = {
  readFile: Em,
  readFileSync: ym,
  writeFile: wm,
  writeFileSync: _m
};
var Sm = Tm;
const wn = Sm;
var Am = {
  // jsonfile exports
  readJson: wn.readFile,
  readJsonSync: wn.readFileSync,
  writeJson: wn.writeFile,
  writeJsonSync: wn.writeFileSync
};
const bm = $e.fromCallback, Ir = De, mu = Q, gu = Ze, Om = jt.pathExists;
function Cm(e, t, r, n) {
  typeof r == "function" && (n = r, r = "utf8");
  const i = mu.dirname(e);
  Om(i, (o, s) => {
    if (o) return n(o);
    if (s) return Ir.writeFile(e, t, r, n);
    gu.mkdirs(i, (a) => {
      if (a) return n(a);
      Ir.writeFile(e, t, r, n);
    });
  });
}
function Nm(e, ...t) {
  const r = mu.dirname(e);
  if (Ir.existsSync(r))
    return Ir.writeFileSync(e, ...t);
  gu.mkdirsSync(r), Ir.writeFileSync(e, ...t);
}
var us = {
  outputFile: bm(Cm),
  outputFileSync: Nm
};
const { stringify: Im } = cs, { outputFile: Rm } = us;
async function $m(e, t, r = {}) {
  const n = Im(t, r);
  await Rm(e, n, r);
}
var Dm = $m;
const { stringify: Pm } = cs, { outputFileSync: Fm } = us;
function Lm(e, t, r) {
  const n = Pm(t, r);
  Fm(e, n, r);
}
var xm = Lm;
const Um = $e.fromPromise, Ie = Am;
Ie.outputJson = Um(Dm);
Ie.outputJsonSync = xm;
Ie.outputJSON = Ie.outputJson;
Ie.outputJSONSync = Ie.outputJsonSync;
Ie.writeJSON = Ie.writeJson;
Ie.writeJSONSync = Ie.writeJsonSync;
Ie.readJSON = Ie.readJson;
Ie.readJSONSync = Ie.readJsonSync;
var km = Ie;
const Mm = De, xo = Q, Bm = as.copy, Eu = ri.remove, jm = Ze.mkdirp, Hm = jt.pathExists, Ea = dr;
function qm(e, t, r, n) {
  typeof r == "function" && (n = r, r = {}), r = r || {};
  const i = r.overwrite || r.clobber || !1;
  Ea.checkPaths(e, t, "move", r, (o, s) => {
    if (o) return n(o);
    const { srcStat: a, isChangingCase: l = !1 } = s;
    Ea.checkParentPaths(e, a, t, "move", (f) => {
      if (f) return n(f);
      if (Gm(t)) return ya(e, t, i, l, n);
      jm(xo.dirname(t), (c) => c ? n(c) : ya(e, t, i, l, n));
    });
  });
}
function Gm(e) {
  const t = xo.dirname(e);
  return xo.parse(t).root === t;
}
function ya(e, t, r, n, i) {
  if (n) return Pi(e, t, r, i);
  if (r)
    return Eu(t, (o) => o ? i(o) : Pi(e, t, r, i));
  Hm(t, (o, s) => o ? i(o) : s ? i(new Error("dest already exists.")) : Pi(e, t, r, i));
}
function Pi(e, t, r, n) {
  Mm.rename(e, t, (i) => i ? i.code !== "EXDEV" ? n(i) : Vm(e, t, r, n) : n());
}
function Vm(e, t, r, n) {
  Bm(e, t, {
    overwrite: r,
    errorOnExist: !0
  }, (o) => o ? n(o) : Eu(e, n));
}
var Wm = qm;
const yu = De, Uo = Q, Ym = as.copySync, vu = ri.removeSync, zm = Ze.mkdirpSync, va = dr;
function Xm(e, t, r) {
  r = r || {};
  const n = r.overwrite || r.clobber || !1, { srcStat: i, isChangingCase: o = !1 } = va.checkPathsSync(e, t, "move", r);
  return va.checkParentPathsSync(e, i, t, "move"), Km(t) || zm(Uo.dirname(t)), Jm(e, t, n, o);
}
function Km(e) {
  const t = Uo.dirname(e);
  return Uo.parse(t).root === t;
}
function Jm(e, t, r, n) {
  if (n) return Fi(e, t, r);
  if (r)
    return vu(t), Fi(e, t, r);
  if (yu.existsSync(t)) throw new Error("dest already exists.");
  return Fi(e, t, r);
}
function Fi(e, t, r) {
  try {
    yu.renameSync(e, t);
  } catch (n) {
    if (n.code !== "EXDEV") throw n;
    return Qm(e, t, r);
  }
}
function Qm(e, t, r) {
  return Ym(e, t, {
    overwrite: r,
    errorOnExist: !0
  }), vu(e);
}
var Zm = Xm;
const eg = $e.fromCallback;
var tg = {
  move: eg(Wm),
  moveSync: Zm
}, bt = {
  // Export promiseified graceful-fs:
  ...Bt,
  // Export extra methods:
  ...as,
  ...Mp,
  ...hm,
  ...km,
  ...Ze,
  ...tg,
  ...us,
  ...jt,
  ...ri
}, st = {}, wt = {}, Ee = {}, _t = {};
Object.defineProperty(_t, "__esModule", { value: !0 });
_t.CancellationError = _t.CancellationToken = void 0;
const rg = Zn;
class ng extends rg.EventEmitter {
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
      return Promise.reject(new ko());
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
          o(new ko());
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
_t.CancellationToken = ng;
class ko extends Error {
  constructor() {
    super("cancelled");
  }
}
_t.CancellationError = ko;
var hr = {};
Object.defineProperty(hr, "__esModule", { value: !0 });
hr.newError = ig;
function ig(e, t) {
  const r = new Error(e);
  return r.code = t, r;
}
var Ne = {}, Mo = { exports: {} }, _n = { exports: {} }, Li, wa;
function og() {
  if (wa) return Li;
  wa = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, i = n * 7, o = n * 365.25;
  Li = function(c, u) {
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
  return Li;
}
var xi, _a;
function wu() {
  if (_a) return xi;
  _a = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = f, n.disable = a, n.enable = o, n.enabled = l, n.humanize = og(), n.destroy = c, Object.keys(t).forEach((u) => {
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
      function _(...S) {
        if (!_.enabled)
          return;
        const A = _, D = Number(/* @__PURE__ */ new Date()), L = D - (h || D);
        A.diff = L, A.prev = h, A.curr = D, h = D, S[0] = n.coerce(S[0]), typeof S[0] != "string" && S.unshift("%O");
        let j = 0;
        S[0] = S[0].replace(/%([a-zA-Z%])/g, (B, ce) => {
          if (B === "%%")
            return "%";
          j++;
          const E = n.formatters[ce];
          if (typeof E == "function") {
            const Y = S[j];
            B = E.call(A, Y), S.splice(j, 1), j--;
          }
          return B;
        }), n.formatArgs.call(A, S), (A.log || n.log).apply(A, S);
      }
      return _.namespace = u, _.useColors = n.useColors(), _.color = n.selectColor(u), _.extend = i, _.destroy = n.destroy, Object.defineProperty(_, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (w !== n.namespaces && (w = n.namespaces, y = n.enabled(u)), y),
        set: (S) => {
          m = S;
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
  return xi = e, xi;
}
var Ta;
function sg() {
  return Ta || (Ta = 1, function(e, t) {
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
    e.exports = wu()(t);
    const { formatters: a } = e.exports;
    a.j = function(l) {
      try {
        return JSON.stringify(l);
      } catch (f) {
        return "[UnexpectedJSONParseError]: " + f.message;
      }
    };
  }(_n, _n.exports)), _n.exports;
}
var Tn = { exports: {} }, Ui, Sa;
function ag() {
  return Sa || (Sa = 1, Ui = (e, t = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = t.indexOf(r + e), i = t.indexOf("--");
    return n !== -1 && (i === -1 || n < i);
  }), Ui;
}
var ki, Aa;
function lg() {
  if (Aa) return ki;
  Aa = 1;
  const e = ot, t = Cc, r = ag(), { env: n } = process;
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
  return ki = {
    supportsColor: a,
    stdout: o(s(!0, t.isatty(1))),
    stderr: o(s(!0, t.isatty(2)))
  }, ki;
}
var ba;
function cg() {
  return ba || (ba = 1, function(e, t) {
    const r = Cc, n = Qn;
    t.init = c, t.log = a, t.formatArgs = o, t.save = l, t.load = f, t.useColors = i, t.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = lg();
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
      const w = m.substring(6).toLowerCase().replace(/_([a-z])/g, (_, S) => S.toUpperCase());
      let y = process.env[m];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), h[w] = y, h;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function o(h) {
      const { namespace: m, useColors: w } = this;
      if (w) {
        const y = this.color, _ = "\x1B[3" + (y < 8 ? y : "8;5;" + y), S = `  ${_};1m${m} \x1B[0m`;
        h[0] = S + h[0].split(`
`).join(`
` + S), h.push(_ + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
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
    e.exports = wu()(t);
    const { formatters: u } = e.exports;
    u.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, u.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(Tn, Tn.exports)), Tn.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Mo.exports = sg() : Mo.exports = cg();
var ug = Mo.exports, Qr = {};
Object.defineProperty(Qr, "__esModule", { value: !0 });
Qr.ProgressCallbackTransform = void 0;
const fg = Xr;
class dg extends fg.Transform {
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
Qr.ProgressCallbackTransform = dg;
Object.defineProperty(Ne, "__esModule", { value: !0 });
Ne.DigestTransform = Ne.HttpExecutor = Ne.HttpError = void 0;
Ne.createHttpError = Bo;
Ne.parseJson = wg;
Ne.configureRequestOptionsFromUrl = Tu;
Ne.configureRequestUrl = ds;
Ne.safeGetHeader = or;
Ne.configureRequestOptions = Gn;
Ne.safeStringifyJson = Vn;
const hg = ur, pg = ug, mg = Re, gg = Xr, _u = fr, Eg = _t, Oa = hr, yg = Qr, _r = (0, pg.default)("electron-builder");
function Bo(e, t = null) {
  return new fs(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + Vn(e.headers), t);
}
const vg = /* @__PURE__ */ new Map([
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
class fs extends Error {
  constructor(t, r = `HTTP error: ${vg.get(t) || t}`, n = null) {
    super(r), this.statusCode = t, this.description = n, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
Ne.HttpError = fs;
function wg(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class qn {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, r = new Eg.CancellationToken(), n) {
    Gn(t);
    const i = n == null ? void 0 : JSON.stringify(n), o = i ? Buffer.from(i) : void 0;
    if (o != null) {
      _r(i);
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
    return _r.enabled && _r(`Request: ${Vn(t)}`), r.createPromise((o, s, a) => {
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
    if (_r.enabled && _r(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${Vn(r)}`), t.statusCode === 404) {
      o(Bo(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const f = (l = t.statusCode) !== null && l !== void 0 ? l : 0, c = f >= 300 && f < 400, u = or(t, "location");
    if (c && u != null) {
      if (s > this.maxRedirects) {
        o(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(qn.prepareRedirectUrlOptions(u, r), n, a, s).then(i).catch(o);
      return;
    }
    t.setEncoding("utf8");
    let h = "";
    t.on("error", o), t.on("data", (m) => h += m), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const m = or(t, "content-type"), w = m != null && (Array.isArray(m) ? m.find((y) => y.includes("json")) != null : m.includes("json"));
          o(Bo(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

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
      ds(t, a), Gn(a), this.doDownload(a, {
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
      const s = or(o, "location");
      if (s != null) {
        n < this.maxRedirects ? this.doDownload(qn.prepareRedirectUrlOptions(s, t), r, n++) : r.callback(this.createMaxRedirectError());
        return;
      }
      r.responseHandler == null ? Tg(r, o) : r.responseHandler(o, r.callback);
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
    const n = Tu(t, { ...r }), i = n.headers;
    if (i != null && i.authorization) {
      const o = new _u.URL(t);
      (o.hostname.endsWith(".amazonaws.com") || o.searchParams.has("X-Amz-Credential")) && delete i.authorization;
    }
    return n;
  }
  static retryOnServerError(t, r = 3) {
    for (let n = 0; ; n++)
      try {
        return t();
      } catch (i) {
        if (n < r && (i instanceof fs && i.isServerError() || i.code === "EPIPE"))
          continue;
        throw i;
      }
  }
}
Ne.HttpExecutor = qn;
function Tu(e, t) {
  const r = Gn(t);
  return ds(new _u.URL(e), r), r;
}
function ds(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class jo extends gg.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, r = "sha512", n = "base64") {
    super(), this.expected = t, this.algorithm = r, this.encoding = n, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, hg.createHash)(r);
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
      throw (0, Oa.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, Oa.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
Ne.DigestTransform = jo;
function _g(e, t, r) {
  return e != null && t != null && e !== t ? (r(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function or(e, t) {
  const r = e.headers[t];
  return r == null ? null : Array.isArray(r) ? r.length === 0 ? null : r[r.length - 1] : r;
}
function Tg(e, t) {
  if (!_g(or(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const r = [];
  if (e.options.onProgress != null) {
    const s = or(t, "content-length");
    s != null && r.push(new yg.ProgressCallbackTransform(parseInt(s, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const n = e.options.sha512;
  n != null ? r.push(new jo(n, "sha512", n.length === 128 && !n.includes("+") && !n.includes("Z") && !n.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && r.push(new jo(e.options.sha2, "sha256", "hex"));
  const i = (0, mg.createWriteStream)(e.destination);
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
function Gn(e, t, r) {
  r != null && (e.method = r), e.headers = { ...e.headers };
  const n = e.headers;
  return t != null && (n.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), n["User-Agent"] == null && (n["User-Agent"] = "electron-builder"), (r == null || r === "GET" || n["Cache-Control"] == null) && (n["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function Vn(e, t) {
  return JSON.stringify(e, (r, n) => r.endsWith("Authorization") || r.endsWith("authorization") || r.endsWith("Password") || r.endsWith("PASSWORD") || r.endsWith("Token") || r.includes("password") || r.includes("token") || t != null && t.has(r) ? "<stripped sensitive data>" : n, 2);
}
var ii = {};
Object.defineProperty(ii, "__esModule", { value: !0 });
ii.MemoLazy = void 0;
class Sg {
  constructor(t, r) {
    this.selector = t, this.creator = r, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && Su(this.selected, t))
      return this._value;
    this.selected = t;
    const r = this.creator(t);
    return this.value = r, r;
  }
  set value(t) {
    this._value = t;
  }
}
ii.MemoLazy = Sg;
function Su(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), o = Object.keys(t);
    return i.length === o.length && i.every((s) => Su(e[s], t[s]));
  }
  return e === t;
}
var oi = {};
Object.defineProperty(oi, "__esModule", { value: !0 });
oi.githubUrl = Ag;
oi.getS3LikeProviderBaseUrl = bg;
function Ag(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function bg(e) {
  const t = e.provider;
  if (t === "s3")
    return Og(e);
  if (t === "spaces")
    return Cg(e);
  throw new Error(`Not supported provider: ${t}`);
}
function Og(e) {
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
  return Au(t, e.path);
}
function Au(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function Cg(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return Au(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var hs = {};
Object.defineProperty(hs, "__esModule", { value: !0 });
hs.retry = bu;
const Ng = _t;
async function bu(e, t, r, n = 0, i = 0, o) {
  var s;
  const a = new Ng.CancellationToken();
  try {
    return await e();
  } catch (l) {
    if ((!((s = o == null ? void 0 : o(l)) !== null && s !== void 0) || s) && t > 0 && !a.cancelled)
      return await new Promise((f) => setTimeout(f, r + n * i)), await bu(e, t - 1, r, n, i + 1, o);
    throw l;
  }
}
var ps = {};
Object.defineProperty(ps, "__esModule", { value: !0 });
ps.parseDn = Ig;
function Ig(e) {
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
var lr = {};
Object.defineProperty(lr, "__esModule", { value: !0 });
lr.nil = lr.UUID = void 0;
const Ou = ur, Cu = hr, Rg = "options.name must be either a string or a Buffer", Ca = (0, Ou.randomBytes)(16);
Ca[0] = Ca[0] | 1;
const Un = {}, X = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  Un[t] = e, X[e] = t;
}
class Mt {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const r = Mt.check(t);
    if (!r)
      throw new Error("not a UUID");
    this.version = r.version, r.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, r) {
    return $g(t, "sha1", 80, r);
  }
  toString() {
    return this.ascii == null && (this.ascii = Dg(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, r = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: (Un[t[14] + t[15]] & 240) >> 4,
        variant: Na((Un[t[19] + t[20]] & 224) >> 5),
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
        variant: Na((t[r + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, Cu.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const r = Buffer.allocUnsafe(16);
    let n = 0;
    for (let i = 0; i < 16; i++)
      r[i] = Un[t[n++] + t[n++]], (i === 3 || i === 5 || i === 7 || i === 9) && (n += 1);
    return r;
  }
}
lr.UUID = Mt;
Mt.OID = Mt.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function Na(e) {
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
var Rr;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Rr || (Rr = {}));
function $g(e, t, r, n, i = Rr.ASCII) {
  const o = (0, Ou.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, Cu.newError)(Rg, "ERR_INVALID_UUID_NAME");
  o.update(n), o.update(e);
  const a = o.digest();
  let l;
  switch (i) {
    case Rr.BINARY:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = a;
      break;
    case Rr.OBJECT:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = new Mt(a);
      break;
    default:
      l = X[a[0]] + X[a[1]] + X[a[2]] + X[a[3]] + "-" + X[a[4]] + X[a[5]] + "-" + X[a[6] & 15 | r] + X[a[7]] + "-" + X[a[8] & 63 | 128] + X[a[9]] + "-" + X[a[10]] + X[a[11]] + X[a[12]] + X[a[13]] + X[a[14]] + X[a[15]];
      break;
  }
  return l;
}
function Dg(e) {
  return X[e[0]] + X[e[1]] + X[e[2]] + X[e[3]] + "-" + X[e[4]] + X[e[5]] + "-" + X[e[6]] + X[e[7]] + "-" + X[e[8]] + X[e[9]] + "-" + X[e[10]] + X[e[11]] + X[e[12]] + X[e[13]] + X[e[14]] + X[e[15]];
}
lr.nil = new Mt("00000000-0000-0000-0000-000000000000");
var Zr = {}, Nu = {};
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
      for (var d = Math.max(t.MAX_BUFFER_LENGTH, 10), b = 0, T = 0, J = r.length; T < J; T++) {
        var ie = p[r[T]].length;
        if (ie > d)
          switch (r[T]) {
            case "textNode":
              ee(p);
              break;
            case "cdata":
              M(p, "oncdata", p.cdata), p.cdata = "";
              break;
            case "script":
              M(p, "onscript", p.script), p.script = "";
              break;
            default:
              C(p, "Max buffer length exceeded: " + r[T]);
          }
        b = Math.max(b, ie);
      }
      var ae = t.MAX_BUFFER_LENGTH - b;
      p.bufferCheckPosition = ae + p.position;
    }
    function o(p) {
      for (var d = 0, b = r.length; d < b; d++)
        p[r[d]] = "";
    }
    function s(p) {
      ee(p), p.cdata !== "" && (M(p, "oncdata", p.cdata), p.cdata = ""), p.script !== "" && (M(p, "onscript", p.script), p.script = "");
    }
    n.prototype = {
      end: function() {
        $(this);
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
      }, this._parser.onerror = function(T) {
        b.emit("error", T), b._parser.error = null;
      }, this._decoder = null, l.forEach(function(T) {
        Object.defineProperty(b, "on" + T, {
          get: function() {
            return b._parser["on" + T];
          },
          set: function(J) {
            if (!J)
              return b.removeAllListeners(T), b._parser["on" + T] = J, J;
            b.on(T, J);
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
          var d = nh.StringDecoder;
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
        var T = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        T.splice(0, 0, p), b.emit.apply(b, T);
      }), a.prototype.on.call(b, p, d);
    };
    var u = "[CDATA[", h = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", w = "http://www.w3.org/2000/xmlns/", y = { xml: m, xmlns: w }, _ = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, S = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, A = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, D = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function L(p) {
      return p === " " || p === `
` || p === "\r" || p === "	";
    }
    function j(p) {
      return p === '"' || p === "'";
    }
    function H(p) {
      return p === ">" || L(p);
    }
    function B(p, d) {
      return p.test(d);
    }
    function ce(p, d) {
      return !B(p, d);
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
    for (var Y in t.STATE)
      t.STATE[t.STATE[Y]] = Y;
    E = t.STATE;
    function q(p, d, b) {
      p[d] && p[d](b);
    }
    function M(p, d, b) {
      p.textNode && ee(p), q(p, d, b);
    }
    function ee(p) {
      p.textNode = I(p.opt, p.textNode), p.textNode && q(p, "ontext", p.textNode), p.textNode = "";
    }
    function I(p, d) {
      return p.trim && (d = d.trim()), p.normalize && (d = d.replace(/\s+/g, " ")), d;
    }
    function C(p, d) {
      return ee(p), p.trackPosition && (d += `
Line: ` + p.line + `
Column: ` + p.column + `
Char: ` + p.c), d = new Error(d), p.error = d, q(p, "onerror", d), p;
    }
    function $(p) {
      return p.sawRoot && !p.closedRoot && O(p, "Unclosed root tag"), p.state !== E.BEGIN && p.state !== E.BEGIN_WHITESPACE && p.state !== E.TEXT && C(p, "Unexpected end"), ee(p), p.c = "", p.closed = !0, q(p, "onend"), n.call(p, p.strict, p.opt), p;
    }
    function O(p, d) {
      if (typeof p != "object" || !(p instanceof n))
        throw new Error("bad call to strictFail");
      p.strict && C(p, d);
    }
    function P(p) {
      p.strict || (p.tagName = p.tagName[p.looseCase]());
      var d = p.tags[p.tags.length - 1] || p, b = p.tag = { name: p.tagName, attributes: {} };
      p.opt.xmlns && (b.ns = d.ns), p.attribList.length = 0, M(p, "onopentagstart", b);
    }
    function R(p, d) {
      var b = p.indexOf(":"), T = b < 0 ? ["", p] : p.split(":"), J = T[0], ie = T[1];
      return d && p === "xmlns" && (J = "xmlns", ie = ""), { prefix: J, local: ie };
    }
    function k(p) {
      if (p.strict || (p.attribName = p.attribName[p.looseCase]()), p.attribList.indexOf(p.attribName) !== -1 || p.tag.attributes.hasOwnProperty(p.attribName)) {
        p.attribName = p.attribValue = "";
        return;
      }
      if (p.opt.xmlns) {
        var d = R(p.attribName, !0), b = d.prefix, T = d.local;
        if (b === "xmlns")
          if (T === "xml" && p.attribValue !== m)
            O(
              p,
              "xml: prefix must be bound to " + m + `
Actual: ` + p.attribValue
            );
          else if (T === "xmlns" && p.attribValue !== w)
            O(
              p,
              "xmlns: prefix must be bound to " + w + `
Actual: ` + p.attribValue
            );
          else {
            var J = p.tag, ie = p.tags[p.tags.length - 1] || p;
            J.ns === ie.ns && (J.ns = Object.create(ie.ns)), J.ns[T] = p.attribValue;
          }
        p.attribList.push([p.attribName, p.attribValue]);
      } else
        p.tag.attributes[p.attribName] = p.attribValue, M(p, "onattribute", {
          name: p.attribName,
          value: p.attribValue
        });
      p.attribName = p.attribValue = "";
    }
    function z(p, d) {
      if (p.opt.xmlns) {
        var b = p.tag, T = R(p.tagName);
        b.prefix = T.prefix, b.local = T.local, b.uri = b.ns[T.prefix] || "", b.prefix && !b.uri && (O(p, "Unbound namespace prefix: " + JSON.stringify(p.tagName)), b.uri = T.prefix);
        var J = p.tags[p.tags.length - 1] || p;
        b.ns && J.ns !== b.ns && Object.keys(b.ns).forEach(function(cn) {
          M(p, "onopennamespace", {
            prefix: cn,
            uri: b.ns[cn]
          });
        });
        for (var ie = 0, ae = p.attribList.length; ie < ae; ie++) {
          var ye = p.attribList[ie], Te = ye[0], lt = ye[1], fe = R(Te, !0), je = fe.prefix, Si = fe.local, ln = je === "" ? "" : b.ns[je] || "", gr = {
            name: Te,
            value: lt,
            prefix: je,
            local: Si,
            uri: ln
          };
          je && je !== "xmlns" && !ln && (O(p, "Unbound namespace prefix: " + JSON.stringify(je)), gr.uri = je), p.tag.attributes[Te] = gr, M(p, "onattribute", gr);
        }
        p.attribList.length = 0;
      }
      p.tag.isSelfClosing = !!d, p.sawRoot = !0, p.tags.push(p.tag), M(p, "onopentag", p.tag), d || (!p.noscript && p.tagName.toLowerCase() === "script" ? p.state = E.SCRIPT : p.state = E.TEXT, p.tag = null, p.tagName = ""), p.attribName = p.attribValue = "", p.attribList.length = 0;
    }
    function G(p) {
      if (!p.tagName) {
        O(p, "Weird empty close tag."), p.textNode += "</>", p.state = E.TEXT;
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
      for (var T = b; d--; ) {
        var J = p.tags[d];
        if (J.name !== T)
          O(p, "Unexpected close tag");
        else
          break;
      }
      if (d < 0) {
        O(p, "Unmatched closing tag: " + p.tagName), p.textNode += "</" + p.tagName + ">", p.state = E.TEXT;
        return;
      }
      p.tagName = b;
      for (var ie = p.tags.length; ie-- > d; ) {
        var ae = p.tag = p.tags.pop();
        p.tagName = p.tag.name, M(p, "onclosetag", p.tagName);
        var ye = {};
        for (var Te in ae.ns)
          ye[Te] = ae.ns[Te];
        var lt = p.tags[p.tags.length - 1] || p;
        p.opt.xmlns && ae.ns !== lt.ns && Object.keys(ae.ns).forEach(function(fe) {
          var je = ae.ns[fe];
          M(p, "onclosenamespace", { prefix: fe, uri: je });
        });
      }
      d === 0 && (p.closedRoot = !0), p.tagName = p.attribValue = p.attribName = "", p.attribList.length = 0, p.state = E.TEXT;
    }
    function te(p) {
      var d = p.entity, b = d.toLowerCase(), T, J = "";
      return p.ENTITIES[d] ? p.ENTITIES[d] : p.ENTITIES[b] ? p.ENTITIES[b] : (d = b, d.charAt(0) === "#" && (d.charAt(1) === "x" ? (d = d.slice(2), T = parseInt(d, 16), J = T.toString(16)) : (d = d.slice(1), T = parseInt(d, 10), J = T.toString(10))), d = d.replace(/^0+/, ""), isNaN(T) || J.toLowerCase() !== d ? (O(p, "Invalid character entity"), "&" + p.entity + ";") : String.fromCodePoint(T));
    }
    function pe(p, d) {
      d === "<" ? (p.state = E.OPEN_WAKA, p.startTagPosition = p.position) : L(d) || (O(p, "Non-whitespace before first tag."), p.textNode = d, p.state = E.TEXT);
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
        return C(
          d,
          "Cannot write after close. Assign an onready handler."
        );
      if (p === null)
        return $(d);
      typeof p == "object" && (p = p.toString());
      for (var b = 0, T = ""; T = U(p, b++), d.c = T, !!T; )
        switch (d.trackPosition && (d.position++, T === `
` ? (d.line++, d.column = 0) : d.column++), d.state) {
          case E.BEGIN:
            if (d.state = E.BEGIN_WHITESPACE, T === "\uFEFF")
              continue;
            pe(d, T);
            continue;
          case E.BEGIN_WHITESPACE:
            pe(d, T);
            continue;
          case E.TEXT:
            if (d.sawRoot && !d.closedRoot) {
              for (var J = b - 1; T && T !== "<" && T !== "&"; )
                T = U(p, b++), T && d.trackPosition && (d.position++, T === `
` ? (d.line++, d.column = 0) : d.column++);
              d.textNode += p.substring(J, b - 1);
            }
            T === "<" && !(d.sawRoot && d.closedRoot && !d.strict) ? (d.state = E.OPEN_WAKA, d.startTagPosition = d.position) : (!L(T) && (!d.sawRoot || d.closedRoot) && O(d, "Text data outside of root node."), T === "&" ? d.state = E.TEXT_ENTITY : d.textNode += T);
            continue;
          case E.SCRIPT:
            T === "<" ? d.state = E.SCRIPT_ENDING : d.script += T;
            continue;
          case E.SCRIPT_ENDING:
            T === "/" ? d.state = E.CLOSE_TAG : (d.script += "<" + T, d.state = E.SCRIPT);
            continue;
          case E.OPEN_WAKA:
            if (T === "!")
              d.state = E.SGML_DECL, d.sgmlDecl = "";
            else if (!L(T)) if (B(_, T))
              d.state = E.OPEN_TAG, d.tagName = T;
            else if (T === "/")
              d.state = E.CLOSE_TAG, d.tagName = "";
            else if (T === "?")
              d.state = E.PROC_INST, d.procInstName = d.procInstBody = "";
            else {
              if (O(d, "Unencoded <"), d.startTagPosition + 1 < d.position) {
                var ie = d.position - d.startTagPosition;
                T = new Array(ie).join(" ") + T;
              }
              d.textNode += "<" + T, d.state = E.TEXT;
            }
            continue;
          case E.SGML_DECL:
            if (d.sgmlDecl + T === "--") {
              d.state = E.COMMENT, d.comment = "", d.sgmlDecl = "";
              continue;
            }
            d.doctype && d.doctype !== !0 && d.sgmlDecl ? (d.state = E.DOCTYPE_DTD, d.doctype += "<!" + d.sgmlDecl + T, d.sgmlDecl = "") : (d.sgmlDecl + T).toUpperCase() === u ? (M(d, "onopencdata"), d.state = E.CDATA, d.sgmlDecl = "", d.cdata = "") : (d.sgmlDecl + T).toUpperCase() === h ? (d.state = E.DOCTYPE, (d.doctype || d.sawRoot) && O(
              d,
              "Inappropriately located doctype declaration"
            ), d.doctype = "", d.sgmlDecl = "") : T === ">" ? (M(d, "onsgmldeclaration", d.sgmlDecl), d.sgmlDecl = "", d.state = E.TEXT) : (j(T) && (d.state = E.SGML_DECL_QUOTED), d.sgmlDecl += T);
            continue;
          case E.SGML_DECL_QUOTED:
            T === d.q && (d.state = E.SGML_DECL, d.q = ""), d.sgmlDecl += T;
            continue;
          case E.DOCTYPE:
            T === ">" ? (d.state = E.TEXT, M(d, "ondoctype", d.doctype), d.doctype = !0) : (d.doctype += T, T === "[" ? d.state = E.DOCTYPE_DTD : j(T) && (d.state = E.DOCTYPE_QUOTED, d.q = T));
            continue;
          case E.DOCTYPE_QUOTED:
            d.doctype += T, T === d.q && (d.q = "", d.state = E.DOCTYPE);
            continue;
          case E.DOCTYPE_DTD:
            T === "]" ? (d.doctype += T, d.state = E.DOCTYPE) : T === "<" ? (d.state = E.OPEN_WAKA, d.startTagPosition = d.position) : j(T) ? (d.doctype += T, d.state = E.DOCTYPE_DTD_QUOTED, d.q = T) : d.doctype += T;
            continue;
          case E.DOCTYPE_DTD_QUOTED:
            d.doctype += T, T === d.q && (d.state = E.DOCTYPE_DTD, d.q = "");
            continue;
          case E.COMMENT:
            T === "-" ? d.state = E.COMMENT_ENDING : d.comment += T;
            continue;
          case E.COMMENT_ENDING:
            T === "-" ? (d.state = E.COMMENT_ENDED, d.comment = I(d.opt, d.comment), d.comment && M(d, "oncomment", d.comment), d.comment = "") : (d.comment += "-" + T, d.state = E.COMMENT);
            continue;
          case E.COMMENT_ENDED:
            T !== ">" ? (O(d, "Malformed comment"), d.comment += "--" + T, d.state = E.COMMENT) : d.doctype && d.doctype !== !0 ? d.state = E.DOCTYPE_DTD : d.state = E.TEXT;
            continue;
          case E.CDATA:
            T === "]" ? d.state = E.CDATA_ENDING : d.cdata += T;
            continue;
          case E.CDATA_ENDING:
            T === "]" ? d.state = E.CDATA_ENDING_2 : (d.cdata += "]" + T, d.state = E.CDATA);
            continue;
          case E.CDATA_ENDING_2:
            T === ">" ? (d.cdata && M(d, "oncdata", d.cdata), M(d, "onclosecdata"), d.cdata = "", d.state = E.TEXT) : T === "]" ? d.cdata += "]" : (d.cdata += "]]" + T, d.state = E.CDATA);
            continue;
          case E.PROC_INST:
            T === "?" ? d.state = E.PROC_INST_ENDING : L(T) ? d.state = E.PROC_INST_BODY : d.procInstName += T;
            continue;
          case E.PROC_INST_BODY:
            if (!d.procInstBody && L(T))
              continue;
            T === "?" ? d.state = E.PROC_INST_ENDING : d.procInstBody += T;
            continue;
          case E.PROC_INST_ENDING:
            T === ">" ? (M(d, "onprocessinginstruction", {
              name: d.procInstName,
              body: d.procInstBody
            }), d.procInstName = d.procInstBody = "", d.state = E.TEXT) : (d.procInstBody += "?" + T, d.state = E.PROC_INST_BODY);
            continue;
          case E.OPEN_TAG:
            B(S, T) ? d.tagName += T : (P(d), T === ">" ? z(d) : T === "/" ? d.state = E.OPEN_TAG_SLASH : (L(T) || O(d, "Invalid character in tag name"), d.state = E.ATTRIB));
            continue;
          case E.OPEN_TAG_SLASH:
            T === ">" ? (z(d, !0), G(d)) : (O(d, "Forward-slash in opening tag not followed by >"), d.state = E.ATTRIB);
            continue;
          case E.ATTRIB:
            if (L(T))
              continue;
            T === ">" ? z(d) : T === "/" ? d.state = E.OPEN_TAG_SLASH : B(_, T) ? (d.attribName = T, d.attribValue = "", d.state = E.ATTRIB_NAME) : O(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME:
            T === "=" ? d.state = E.ATTRIB_VALUE : T === ">" ? (O(d, "Attribute without value"), d.attribValue = d.attribName, k(d), z(d)) : L(T) ? d.state = E.ATTRIB_NAME_SAW_WHITE : B(S, T) ? d.attribName += T : O(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME_SAW_WHITE:
            if (T === "=")
              d.state = E.ATTRIB_VALUE;
            else {
              if (L(T))
                continue;
              O(d, "Attribute without value"), d.tag.attributes[d.attribName] = "", d.attribValue = "", M(d, "onattribute", {
                name: d.attribName,
                value: ""
              }), d.attribName = "", T === ">" ? z(d) : B(_, T) ? (d.attribName = T, d.state = E.ATTRIB_NAME) : (O(d, "Invalid attribute name"), d.state = E.ATTRIB);
            }
            continue;
          case E.ATTRIB_VALUE:
            if (L(T))
              continue;
            j(T) ? (d.q = T, d.state = E.ATTRIB_VALUE_QUOTED) : (d.opt.unquotedAttributeValues || C(d, "Unquoted attribute value"), d.state = E.ATTRIB_VALUE_UNQUOTED, d.attribValue = T);
            continue;
          case E.ATTRIB_VALUE_QUOTED:
            if (T !== d.q) {
              T === "&" ? d.state = E.ATTRIB_VALUE_ENTITY_Q : d.attribValue += T;
              continue;
            }
            k(d), d.q = "", d.state = E.ATTRIB_VALUE_CLOSED;
            continue;
          case E.ATTRIB_VALUE_CLOSED:
            L(T) ? d.state = E.ATTRIB : T === ">" ? z(d) : T === "/" ? d.state = E.OPEN_TAG_SLASH : B(_, T) ? (O(d, "No whitespace between attributes"), d.attribName = T, d.attribValue = "", d.state = E.ATTRIB_NAME) : O(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_VALUE_UNQUOTED:
            if (!H(T)) {
              T === "&" ? d.state = E.ATTRIB_VALUE_ENTITY_U : d.attribValue += T;
              continue;
            }
            k(d), T === ">" ? z(d) : d.state = E.ATTRIB;
            continue;
          case E.CLOSE_TAG:
            if (d.tagName)
              T === ">" ? G(d) : B(S, T) ? d.tagName += T : d.script ? (d.script += "</" + d.tagName, d.tagName = "", d.state = E.SCRIPT) : (L(T) || O(d, "Invalid tagname in closing tag"), d.state = E.CLOSE_TAG_SAW_WHITE);
            else {
              if (L(T))
                continue;
              ce(_, T) ? d.script ? (d.script += "</" + T, d.state = E.SCRIPT) : O(d, "Invalid tagname in closing tag.") : d.tagName = T;
            }
            continue;
          case E.CLOSE_TAG_SAW_WHITE:
            if (L(T))
              continue;
            T === ">" ? G(d) : O(d, "Invalid characters in closing tag");
            continue;
          case E.TEXT_ENTITY:
          case E.ATTRIB_VALUE_ENTITY_Q:
          case E.ATTRIB_VALUE_ENTITY_U:
            var ae, ye;
            switch (d.state) {
              case E.TEXT_ENTITY:
                ae = E.TEXT, ye = "textNode";
                break;
              case E.ATTRIB_VALUE_ENTITY_Q:
                ae = E.ATTRIB_VALUE_QUOTED, ye = "attribValue";
                break;
              case E.ATTRIB_VALUE_ENTITY_U:
                ae = E.ATTRIB_VALUE_UNQUOTED, ye = "attribValue";
                break;
            }
            if (T === ";") {
              var Te = te(d);
              d.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(Te) ? (d.entity = "", d.state = ae, d.write(Te)) : (d[ye] += Te, d.entity = "", d.state = ae);
            } else B(d.entity.length ? D : A, T) ? d.entity += T : (O(d, "Invalid character in entity name"), d[ye] += "&" + d.entity + T, d.entity = "", d.state = ae);
            continue;
          default:
            throw new Error(d, "Unknown state: " + d.state);
        }
      return d.position >= d.bufferCheckPosition && i(d), d;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var p = String.fromCharCode, d = Math.floor, b = function() {
        var T = 16384, J = [], ie, ae, ye = -1, Te = arguments.length;
        if (!Te)
          return "";
        for (var lt = ""; ++ye < Te; ) {
          var fe = Number(arguments[ye]);
          if (!isFinite(fe) || // `NaN`, `+Infinity`, or `-Infinity`
          fe < 0 || // not a valid Unicode code point
          fe > 1114111 || // not a valid Unicode code point
          d(fe) !== fe)
            throw RangeError("Invalid code point: " + fe);
          fe <= 65535 ? J.push(fe) : (fe -= 65536, ie = (fe >> 10) + 55296, ae = fe % 1024 + 56320, J.push(ie, ae)), (ye + 1 === Te || J.length > T) && (lt += p.apply(null, J), J.length = 0);
        }
        return lt;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: b,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = b;
    }();
  })(e);
})(Nu);
Object.defineProperty(Zr, "__esModule", { value: !0 });
Zr.XElement = void 0;
Zr.parseXml = xg;
const Pg = Nu, Sn = hr;
class Iu {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, Sn.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!Lg(t))
      throw (0, Sn.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const r = this.attributes === null ? null : this.attributes[t];
    if (r == null)
      throw (0, Sn.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return r;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, r = !1, n = null) {
    const i = this.elementOrNull(t, r);
    if (i === null)
      throw (0, Sn.newError)(n || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return i;
  }
  elementOrNull(t, r = !1) {
    if (this.elements === null)
      return null;
    for (const n of this.elements)
      if (Ia(n, t, r))
        return n;
    return null;
  }
  getElements(t, r = !1) {
    return this.elements === null ? [] : this.elements.filter((n) => Ia(n, t, r));
  }
  elementValueOrEmpty(t, r = !1) {
    const n = this.elementOrNull(t, r);
    return n === null ? "" : n.value;
  }
}
Zr.XElement = Iu;
const Fg = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function Lg(e) {
  return Fg.test(e);
}
function Ia(e, t, r) {
  const n = e.name;
  return n === t || r === !0 && n.length === t.length && n.toLowerCase() === t.toLowerCase();
}
function xg(e) {
  let t = null;
  const r = Pg.parser(!0, {}), n = [];
  return r.onopentag = (i) => {
    const o = new Iu(i.name);
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
  var t = _t;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var r = hr;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return r.newError;
  } });
  var n = Ne;
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
  var i = ii;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var o = Qr;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return o.ProgressCallbackTransform;
  } });
  var s = oi;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return s.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return s.githubUrl;
  } });
  var a = hs;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return a.retry;
  } });
  var l = ps;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return l.parseDn;
  } });
  var f = lr;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return f.UUID;
  } });
  var c = Zr;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return c.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return c.XElement;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  function u(h) {
    return h == null ? [] : Array.isArray(h) ? h : [h];
  }
})(Ee);
var _e = {}, ms = {}, Ve = {};
function Ru(e) {
  return typeof e > "u" || e === null;
}
function Ug(e) {
  return typeof e == "object" && e !== null;
}
function kg(e) {
  return Array.isArray(e) ? e : Ru(e) ? [] : [e];
}
function Mg(e, t) {
  var r, n, i, o;
  if (t)
    for (o = Object.keys(t), r = 0, n = o.length; r < n; r += 1)
      i = o[r], e[i] = t[i];
  return e;
}
function Bg(e, t) {
  var r = "", n;
  for (n = 0; n < t; n += 1)
    r += e;
  return r;
}
function jg(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Ve.isNothing = Ru;
Ve.isObject = Ug;
Ve.toArray = kg;
Ve.repeat = Bg;
Ve.isNegativeZero = jg;
Ve.extend = Mg;
function $u(e, t) {
  var r = "", n = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (r += 'in "' + e.mark.name + '" '), r += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (r += `

` + e.mark.snippet), n + " " + r) : n;
}
function kr(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = $u(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
kr.prototype = Object.create(Error.prototype);
kr.prototype.constructor = kr;
kr.prototype.toString = function(t) {
  return this.name + ": " + $u(this, t);
};
var en = kr, Or = Ve;
function Mi(e, t, r, n, i) {
  var o = "", s = "", a = Math.floor(i / 2) - 1;
  return n - t > a && (o = " ... ", t = n - a + o.length), r - n > a && (s = " ...", r = n + a - s.length), {
    str: o + e.slice(t, r).replace(/\t/g, "→") + s,
    pos: n - t + o.length
    // relative position
  };
}
function Bi(e, t) {
  return Or.repeat(" ", t - e.length) + e;
}
function Hg(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], i = [], o, s = -1; o = r.exec(e.buffer); )
    i.push(o.index), n.push(o.index + o[0].length), e.position <= o.index && s < 0 && (s = n.length - 2);
  s < 0 && (s = n.length - 1);
  var a = "", l, f, c = Math.min(e.line + t.linesAfter, i.length).toString().length, u = t.maxLength - (t.indent + c + 3);
  for (l = 1; l <= t.linesBefore && !(s - l < 0); l++)
    f = Mi(
      e.buffer,
      n[s - l],
      i[s - l],
      e.position - (n[s] - n[s - l]),
      u
    ), a = Or.repeat(" ", t.indent) + Bi((e.line - l + 1).toString(), c) + " | " + f.str + `
` + a;
  for (f = Mi(e.buffer, n[s], i[s], e.position, u), a += Or.repeat(" ", t.indent) + Bi((e.line + 1).toString(), c) + " | " + f.str + `
`, a += Or.repeat("-", t.indent + c + 3 + f.pos) + `^
`, l = 1; l <= t.linesAfter && !(s + l >= i.length); l++)
    f = Mi(
      e.buffer,
      n[s + l],
      i[s + l],
      e.position - (n[s] - n[s + l]),
      u
    ), a += Or.repeat(" ", t.indent) + Bi((e.line + l + 1).toString(), c) + " | " + f.str + `
`;
  return a.replace(/\n$/, "");
}
var qg = Hg, Ra = en, Gg = [
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
], Vg = [
  "scalar",
  "sequence",
  "mapping"
];
function Wg(e) {
  var t = {};
  return e !== null && Object.keys(e).forEach(function(r) {
    e[r].forEach(function(n) {
      t[String(n)] = r;
    });
  }), t;
}
function Yg(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(r) {
    if (Gg.indexOf(r) === -1)
      throw new Ra('Unknown option "' + r + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(r) {
    return r;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = Wg(t.styleAliases || null), Vg.indexOf(this.kind) === -1)
    throw new Ra('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var Pe = Yg, Tr = en, ji = Pe;
function $a(e, t) {
  var r = [];
  return e[t].forEach(function(n) {
    var i = r.length;
    r.forEach(function(o, s) {
      o.tag === n.tag && o.kind === n.kind && o.multi === n.multi && (i = s);
    }), r[i] = n;
  }), r;
}
function zg() {
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
function Ho(e) {
  return this.extend(e);
}
Ho.prototype.extend = function(t) {
  var r = [], n = [];
  if (t instanceof ji)
    n.push(t);
  else if (Array.isArray(t))
    n = n.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (r = r.concat(t.implicit)), t.explicit && (n = n.concat(t.explicit));
  else
    throw new Tr("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(o) {
    if (!(o instanceof ji))
      throw new Tr("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (o.loadKind && o.loadKind !== "scalar")
      throw new Tr("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (o.multi)
      throw new Tr("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(o) {
    if (!(o instanceof ji))
      throw new Tr("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var i = Object.create(Ho.prototype);
  return i.implicit = (this.implicit || []).concat(r), i.explicit = (this.explicit || []).concat(n), i.compiledImplicit = $a(i, "implicit"), i.compiledExplicit = $a(i, "explicit"), i.compiledTypeMap = zg(i.compiledImplicit, i.compiledExplicit), i;
};
var Du = Ho, Xg = Pe, Pu = new Xg("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), Kg = Pe, Fu = new Kg("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), Jg = Pe, Lu = new Jg("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), Qg = Du, xu = new Qg({
  explicit: [
    Pu,
    Fu,
    Lu
  ]
}), Zg = Pe;
function e0(e) {
  if (e === null) return !0;
  var t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function t0() {
  return null;
}
function r0(e) {
  return e === null;
}
var Uu = new Zg("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: e0,
  construct: t0,
  predicate: r0,
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
}), n0 = Pe;
function i0(e) {
  if (e === null) return !1;
  var t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function o0(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function s0(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var ku = new n0("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: i0,
  construct: o0,
  predicate: s0,
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
}), a0 = Ve, l0 = Pe;
function c0(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function u0(e) {
  return 48 <= e && e <= 55;
}
function f0(e) {
  return 48 <= e && e <= 57;
}
function d0(e) {
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
          if (!c0(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "o") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!u0(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
  }
  if (i === "_") return !1;
  for (; r < t; r++)
    if (i = e[r], i !== "_") {
      if (!f0(e.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || i === "_");
}
function h0(e) {
  var t = e, r = 1, n;
  if (t.indexOf("_") !== -1 && (t = t.replace(/_/g, "")), n = t[0], (n === "-" || n === "+") && (n === "-" && (r = -1), t = t.slice(1), n = t[0]), t === "0") return 0;
  if (n === "0") {
    if (t[1] === "b") return r * parseInt(t.slice(2), 2);
    if (t[1] === "x") return r * parseInt(t.slice(2), 16);
    if (t[1] === "o") return r * parseInt(t.slice(2), 8);
  }
  return r * parseInt(t, 10);
}
function p0(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !a0.isNegativeZero(e);
}
var Mu = new l0("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: d0,
  construct: h0,
  predicate: p0,
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
}), Bu = Ve, m0 = Pe, g0 = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function E0(e) {
  return !(e === null || !g0.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function y0(e) {
  var t, r;
  return t = e.replace(/_/g, "").toLowerCase(), r = t[0] === "-" ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : r * parseFloat(t, 10);
}
var v0 = /^[-+]?[0-9]+e/;
function w0(e, t) {
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
  else if (Bu.isNegativeZero(e))
    return "-0.0";
  return r = e.toString(10), v0.test(r) ? r.replace("e", ".e") : r;
}
function _0(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || Bu.isNegativeZero(e));
}
var ju = new m0("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: E0,
  construct: y0,
  predicate: _0,
  represent: w0,
  defaultStyle: "lowercase"
}), Hu = xu.extend({
  implicit: [
    Uu,
    ku,
    Mu,
    ju
  ]
}), qu = Hu, T0 = Pe, Gu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), Vu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function S0(e) {
  return e === null ? !1 : Gu.exec(e) !== null || Vu.exec(e) !== null;
}
function A0(e) {
  var t, r, n, i, o, s, a, l = 0, f = null, c, u, h;
  if (t = Gu.exec(e), t === null && (t = Vu.exec(e)), t === null) throw new Error("Date resolve error");
  if (r = +t[1], n = +t[2] - 1, i = +t[3], !t[4])
    return new Date(Date.UTC(r, n, i));
  if (o = +t[4], s = +t[5], a = +t[6], t[7]) {
    for (l = t[7].slice(0, 3); l.length < 3; )
      l += "0";
    l = +l;
  }
  return t[9] && (c = +t[10], u = +(t[11] || 0), f = (c * 60 + u) * 6e4, t[9] === "-" && (f = -f)), h = new Date(Date.UTC(r, n, i, o, s, a, l)), f && h.setTime(h.getTime() - f), h;
}
function b0(e) {
  return e.toISOString();
}
var Wu = new T0("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: S0,
  construct: A0,
  instanceOf: Date,
  represent: b0
}), O0 = Pe;
function C0(e) {
  return e === "<<" || e === null;
}
var Yu = new O0("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: C0
}), N0 = Pe, gs = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function I0(e) {
  if (e === null) return !1;
  var t, r, n = 0, i = e.length, o = gs;
  for (r = 0; r < i; r++)
    if (t = o.indexOf(e.charAt(r)), !(t > 64)) {
      if (t < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function R0(e) {
  var t, r, n = e.replace(/[\r\n=]/g, ""), i = n.length, o = gs, s = 0, a = [];
  for (t = 0; t < i; t++)
    t % 4 === 0 && t && (a.push(s >> 16 & 255), a.push(s >> 8 & 255), a.push(s & 255)), s = s << 6 | o.indexOf(n.charAt(t));
  return r = i % 4 * 6, r === 0 ? (a.push(s >> 16 & 255), a.push(s >> 8 & 255), a.push(s & 255)) : r === 18 ? (a.push(s >> 10 & 255), a.push(s >> 2 & 255)) : r === 12 && a.push(s >> 4 & 255), new Uint8Array(a);
}
function $0(e) {
  var t = "", r = 0, n, i, o = e.length, s = gs;
  for (n = 0; n < o; n++)
    n % 3 === 0 && n && (t += s[r >> 18 & 63], t += s[r >> 12 & 63], t += s[r >> 6 & 63], t += s[r & 63]), r = (r << 8) + e[n];
  return i = o % 3, i === 0 ? (t += s[r >> 18 & 63], t += s[r >> 12 & 63], t += s[r >> 6 & 63], t += s[r & 63]) : i === 2 ? (t += s[r >> 10 & 63], t += s[r >> 4 & 63], t += s[r << 2 & 63], t += s[64]) : i === 1 && (t += s[r >> 2 & 63], t += s[r << 4 & 63], t += s[64], t += s[64]), t;
}
function D0(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var zu = new N0("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: I0,
  construct: R0,
  predicate: D0,
  represent: $0
}), P0 = Pe, F0 = Object.prototype.hasOwnProperty, L0 = Object.prototype.toString;
function x0(e) {
  if (e === null) return !0;
  var t = [], r, n, i, o, s, a = e;
  for (r = 0, n = a.length; r < n; r += 1) {
    if (i = a[r], s = !1, L0.call(i) !== "[object Object]") return !1;
    for (o in i)
      if (F0.call(i, o))
        if (!s) s = !0;
        else return !1;
    if (!s) return !1;
    if (t.indexOf(o) === -1) t.push(o);
    else return !1;
  }
  return !0;
}
function U0(e) {
  return e !== null ? e : [];
}
var Xu = new P0("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: x0,
  construct: U0
}), k0 = Pe, M0 = Object.prototype.toString;
function B0(e) {
  if (e === null) return !0;
  var t, r, n, i, o, s = e;
  for (o = new Array(s.length), t = 0, r = s.length; t < r; t += 1) {
    if (n = s[t], M0.call(n) !== "[object Object]" || (i = Object.keys(n), i.length !== 1)) return !1;
    o[t] = [i[0], n[i[0]]];
  }
  return !0;
}
function j0(e) {
  if (e === null) return [];
  var t, r, n, i, o, s = e;
  for (o = new Array(s.length), t = 0, r = s.length; t < r; t += 1)
    n = s[t], i = Object.keys(n), o[t] = [i[0], n[i[0]]];
  return o;
}
var Ku = new k0("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: B0,
  construct: j0
}), H0 = Pe, q0 = Object.prototype.hasOwnProperty;
function G0(e) {
  if (e === null) return !0;
  var t, r = e;
  for (t in r)
    if (q0.call(r, t) && r[t] !== null)
      return !1;
  return !0;
}
function V0(e) {
  return e !== null ? e : {};
}
var Ju = new H0("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: G0,
  construct: V0
}), Es = qu.extend({
  implicit: [
    Wu,
    Yu
  ],
  explicit: [
    zu,
    Xu,
    Ku,
    Ju
  ]
}), Lt = Ve, Qu = en, W0 = qg, Y0 = Es, Tt = Object.prototype.hasOwnProperty, Wn = 1, Zu = 2, ef = 3, Yn = 4, Hi = 1, z0 = 2, Da = 3, X0 = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, K0 = /[\x85\u2028\u2029]/, J0 = /[,\[\]\{\}]/, tf = /^(?:!|!!|![a-z\-]+!)$/i, rf = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function Pa(e) {
  return Object.prototype.toString.call(e);
}
function Qe(e) {
  return e === 10 || e === 13;
}
function kt(e) {
  return e === 9 || e === 32;
}
function xe(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function Zt(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function Q0(e) {
  var t;
  return 48 <= e && e <= 57 ? e - 48 : (t = e | 32, 97 <= t && t <= 102 ? t - 97 + 10 : -1);
}
function Z0(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function eE(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function Fa(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function tE(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
var nf = new Array(256), of = new Array(256);
for (var Wt = 0; Wt < 256; Wt++)
  nf[Wt] = Fa(Wt) ? 1 : 0, of[Wt] = Fa(Wt);
function rE(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || Y0, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function sf(e, t) {
  var r = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return r.snippet = W0(r), new Qu(t, r);
}
function x(e, t) {
  throw sf(e, t);
}
function zn(e, t) {
  e.onWarning && e.onWarning.call(null, sf(e, t));
}
var La = {
  YAML: function(t, r, n) {
    var i, o, s;
    t.version !== null && x(t, "duplication of %YAML directive"), n.length !== 1 && x(t, "YAML directive accepts exactly one argument"), i = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), i === null && x(t, "ill-formed argument of the YAML directive"), o = parseInt(i[1], 10), s = parseInt(i[2], 10), o !== 1 && x(t, "unacceptable YAML version of the document"), t.version = n[0], t.checkLineBreaks = s < 2, s !== 1 && s !== 2 && zn(t, "unsupported YAML version of the document");
  },
  TAG: function(t, r, n) {
    var i, o;
    n.length !== 2 && x(t, "TAG directive accepts exactly two arguments"), i = n[0], o = n[1], tf.test(i) || x(t, "ill-formed tag handle (first argument) of the TAG directive"), Tt.call(t.tagMap, i) && x(t, 'there is a previously declared suffix for "' + i + '" tag handle'), rf.test(o) || x(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      o = decodeURIComponent(o);
    } catch {
      x(t, "tag prefix is malformed: " + o);
    }
    t.tagMap[i] = o;
  }
};
function yt(e, t, r, n) {
  var i, o, s, a;
  if (t < r) {
    if (a = e.input.slice(t, r), n)
      for (i = 0, o = a.length; i < o; i += 1)
        s = a.charCodeAt(i), s === 9 || 32 <= s && s <= 1114111 || x(e, "expected valid JSON character");
    else X0.test(a) && x(e, "the stream contains non-printable characters");
    e.result += a;
  }
}
function xa(e, t, r, n) {
  var i, o, s, a;
  for (Lt.isObject(r) || x(e, "cannot merge mappings; the provided source object is unacceptable"), i = Object.keys(r), s = 0, a = i.length; s < a; s += 1)
    o = i[s], Tt.call(t, o) || (t[o] = r[o], n[o] = !0);
}
function er(e, t, r, n, i, o, s, a, l) {
  var f, c;
  if (Array.isArray(i))
    for (i = Array.prototype.slice.call(i), f = 0, c = i.length; f < c; f += 1)
      Array.isArray(i[f]) && x(e, "nested arrays are not supported inside keys"), typeof i == "object" && Pa(i[f]) === "[object Object]" && (i[f] = "[object Object]");
  if (typeof i == "object" && Pa(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(o))
      for (f = 0, c = o.length; f < c; f += 1)
        xa(e, t, o[f], r);
    else
      xa(e, t, o, r);
  else
    !e.json && !Tt.call(r, i) && Tt.call(t, i) && (e.line = s || e.line, e.lineStart = a || e.lineStart, e.position = l || e.position, x(e, "duplicated mapping key")), i === "__proto__" ? Object.defineProperty(t, i, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: o
    }) : t[i] = o, delete r[i];
  return t;
}
function ys(e) {
  var t;
  t = e.input.charCodeAt(e.position), t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : x(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function ue(e, t, r) {
  for (var n = 0, i = e.input.charCodeAt(e.position); i !== 0; ) {
    for (; kt(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (Qe(i))
      for (ys(e), i = e.input.charCodeAt(e.position), n++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && e.lineIndent < r && zn(e, "deficient indentation"), n;
}
function si(e) {
  var t = e.position, r;
  return r = e.input.charCodeAt(t), !!((r === 45 || r === 46) && r === e.input.charCodeAt(t + 1) && r === e.input.charCodeAt(t + 2) && (t += 3, r = e.input.charCodeAt(t), r === 0 || xe(r)));
}
function vs(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += Lt.repeat(`
`, t - 1));
}
function nE(e, t, r) {
  var n, i, o, s, a, l, f, c, u = e.kind, h = e.result, m;
  if (m = e.input.charCodeAt(e.position), xe(m) || Zt(m) || m === 35 || m === 38 || m === 42 || m === 33 || m === 124 || m === 62 || m === 39 || m === 34 || m === 37 || m === 64 || m === 96 || (m === 63 || m === 45) && (i = e.input.charCodeAt(e.position + 1), xe(i) || r && Zt(i)))
    return !1;
  for (e.kind = "scalar", e.result = "", o = s = e.position, a = !1; m !== 0; ) {
    if (m === 58) {
      if (i = e.input.charCodeAt(e.position + 1), xe(i) || r && Zt(i))
        break;
    } else if (m === 35) {
      if (n = e.input.charCodeAt(e.position - 1), xe(n))
        break;
    } else {
      if (e.position === e.lineStart && si(e) || r && Zt(m))
        break;
      if (Qe(m))
        if (l = e.line, f = e.lineStart, c = e.lineIndent, ue(e, !1, -1), e.lineIndent >= t) {
          a = !0, m = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = s, e.line = l, e.lineStart = f, e.lineIndent = c;
          break;
        }
    }
    a && (yt(e, o, s, !1), vs(e, e.line - l), o = s = e.position, a = !1), kt(m) || (s = e.position + 1), m = e.input.charCodeAt(++e.position);
  }
  return yt(e, o, s, !1), e.result ? !0 : (e.kind = u, e.result = h, !1);
}
function iE(e, t) {
  var r, n, i;
  if (r = e.input.charCodeAt(e.position), r !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = i = e.position; (r = e.input.charCodeAt(e.position)) !== 0; )
    if (r === 39)
      if (yt(e, n, e.position, !0), r = e.input.charCodeAt(++e.position), r === 39)
        n = e.position, e.position++, i = e.position;
      else
        return !0;
    else Qe(r) ? (yt(e, n, i, !0), vs(e, ue(e, !1, t)), n = i = e.position) : e.position === e.lineStart && si(e) ? x(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
  x(e, "unexpected end of the stream within a single quoted scalar");
}
function oE(e, t) {
  var r, n, i, o, s, a;
  if (a = e.input.charCodeAt(e.position), a !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, r = n = e.position; (a = e.input.charCodeAt(e.position)) !== 0; ) {
    if (a === 34)
      return yt(e, r, e.position, !0), e.position++, !0;
    if (a === 92) {
      if (yt(e, r, e.position, !0), a = e.input.charCodeAt(++e.position), Qe(a))
        ue(e, !1, t);
      else if (a < 256 && nf[a])
        e.result += of[a], e.position++;
      else if ((s = Z0(a)) > 0) {
        for (i = s, o = 0; i > 0; i--)
          a = e.input.charCodeAt(++e.position), (s = Q0(a)) >= 0 ? o = (o << 4) + s : x(e, "expected hexadecimal character");
        e.result += tE(o), e.position++;
      } else
        x(e, "unknown escape sequence");
      r = n = e.position;
    } else Qe(a) ? (yt(e, r, n, !0), vs(e, ue(e, !1, t)), r = n = e.position) : e.position === e.lineStart && si(e) ? x(e, "unexpected end of the document within a double quoted scalar") : (e.position++, n = e.position);
  }
  x(e, "unexpected end of the stream within a double quoted scalar");
}
function sE(e, t) {
  var r = !0, n, i, o, s = e.tag, a, l = e.anchor, f, c, u, h, m, w = /* @__PURE__ */ Object.create(null), y, _, S, A;
  if (A = e.input.charCodeAt(e.position), A === 91)
    c = 93, m = !1, a = [];
  else if (A === 123)
    c = 125, m = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = a), A = e.input.charCodeAt(++e.position); A !== 0; ) {
    if (ue(e, !0, t), A = e.input.charCodeAt(e.position), A === c)
      return e.position++, e.tag = s, e.anchor = l, e.kind = m ? "mapping" : "sequence", e.result = a, !0;
    r ? A === 44 && x(e, "expected the node content, but found ','") : x(e, "missed comma between flow collection entries"), _ = y = S = null, u = h = !1, A === 63 && (f = e.input.charCodeAt(e.position + 1), xe(f) && (u = h = !0, e.position++, ue(e, !0, t))), n = e.line, i = e.lineStart, o = e.position, cr(e, t, Wn, !1, !0), _ = e.tag, y = e.result, ue(e, !0, t), A = e.input.charCodeAt(e.position), (h || e.line === n) && A === 58 && (u = !0, A = e.input.charCodeAt(++e.position), ue(e, !0, t), cr(e, t, Wn, !1, !0), S = e.result), m ? er(e, a, w, _, y, S, n, i, o) : u ? a.push(er(e, null, w, _, y, S, n, i, o)) : a.push(y), ue(e, !0, t), A = e.input.charCodeAt(e.position), A === 44 ? (r = !0, A = e.input.charCodeAt(++e.position)) : r = !1;
  }
  x(e, "unexpected end of the stream within a flow collection");
}
function aE(e, t) {
  var r, n, i = Hi, o = !1, s = !1, a = t, l = 0, f = !1, c, u;
  if (u = e.input.charCodeAt(e.position), u === 124)
    n = !1;
  else if (u === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; u !== 0; )
    if (u = e.input.charCodeAt(++e.position), u === 43 || u === 45)
      Hi === i ? i = u === 43 ? Da : z0 : x(e, "repeat of a chomping mode identifier");
    else if ((c = eE(u)) >= 0)
      c === 0 ? x(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : s ? x(e, "repeat of an indentation width identifier") : (a = t + c - 1, s = !0);
    else
      break;
  if (kt(u)) {
    do
      u = e.input.charCodeAt(++e.position);
    while (kt(u));
    if (u === 35)
      do
        u = e.input.charCodeAt(++e.position);
      while (!Qe(u) && u !== 0);
  }
  for (; u !== 0; ) {
    for (ys(e), e.lineIndent = 0, u = e.input.charCodeAt(e.position); (!s || e.lineIndent < a) && u === 32; )
      e.lineIndent++, u = e.input.charCodeAt(++e.position);
    if (!s && e.lineIndent > a && (a = e.lineIndent), Qe(u)) {
      l++;
      continue;
    }
    if (e.lineIndent < a) {
      i === Da ? e.result += Lt.repeat(`
`, o ? 1 + l : l) : i === Hi && o && (e.result += `
`);
      break;
    }
    for (n ? kt(u) ? (f = !0, e.result += Lt.repeat(`
`, o ? 1 + l : l)) : f ? (f = !1, e.result += Lt.repeat(`
`, l + 1)) : l === 0 ? o && (e.result += " ") : e.result += Lt.repeat(`
`, l) : e.result += Lt.repeat(`
`, o ? 1 + l : l), o = !0, s = !0, l = 0, r = e.position; !Qe(u) && u !== 0; )
      u = e.input.charCodeAt(++e.position);
    yt(e, r, e.position, !1);
  }
  return !0;
}
function Ua(e, t) {
  var r, n = e.tag, i = e.anchor, o = [], s, a = !1, l;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = o), l = e.input.charCodeAt(e.position); l !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), !(l !== 45 || (s = e.input.charCodeAt(e.position + 1), !xe(s)))); ) {
    if (a = !0, e.position++, ue(e, !0, -1) && e.lineIndent <= t) {
      o.push(null), l = e.input.charCodeAt(e.position);
      continue;
    }
    if (r = e.line, cr(e, t, ef, !1, !0), o.push(e.result), ue(e, !0, -1), l = e.input.charCodeAt(e.position), (e.line === r || e.lineIndent > t) && l !== 0)
      x(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return a ? (e.tag = n, e.anchor = i, e.kind = "sequence", e.result = o, !0) : !1;
}
function lE(e, t, r) {
  var n, i, o, s, a, l, f = e.tag, c = e.anchor, u = {}, h = /* @__PURE__ */ Object.create(null), m = null, w = null, y = null, _ = !1, S = !1, A;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = u), A = e.input.charCodeAt(e.position); A !== 0; ) {
    if (!_ && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), n = e.input.charCodeAt(e.position + 1), o = e.line, (A === 63 || A === 58) && xe(n))
      A === 63 ? (_ && (er(e, u, h, m, w, null, s, a, l), m = w = y = null), S = !0, _ = !0, i = !0) : _ ? (_ = !1, i = !0) : x(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, A = n;
    else {
      if (s = e.line, a = e.lineStart, l = e.position, !cr(e, r, Zu, !1, !0))
        break;
      if (e.line === o) {
        for (A = e.input.charCodeAt(e.position); kt(A); )
          A = e.input.charCodeAt(++e.position);
        if (A === 58)
          A = e.input.charCodeAt(++e.position), xe(A) || x(e, "a whitespace character is expected after the key-value separator within a block mapping"), _ && (er(e, u, h, m, w, null, s, a, l), m = w = y = null), S = !0, _ = !1, i = !1, m = e.tag, w = e.result;
        else if (S)
          x(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = f, e.anchor = c, !0;
      } else if (S)
        x(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = f, e.anchor = c, !0;
    }
    if ((e.line === o || e.lineIndent > t) && (_ && (s = e.line, a = e.lineStart, l = e.position), cr(e, t, Yn, !0, i) && (_ ? w = e.result : y = e.result), _ || (er(e, u, h, m, w, y, s, a, l), m = w = y = null), ue(e, !0, -1), A = e.input.charCodeAt(e.position)), (e.line === o || e.lineIndent > t) && A !== 0)
      x(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return _ && er(e, u, h, m, w, null, s, a, l), S && (e.tag = f, e.anchor = c, e.kind = "mapping", e.result = u), S;
}
function cE(e) {
  var t, r = !1, n = !1, i, o, s;
  if (s = e.input.charCodeAt(e.position), s !== 33) return !1;
  if (e.tag !== null && x(e, "duplication of a tag property"), s = e.input.charCodeAt(++e.position), s === 60 ? (r = !0, s = e.input.charCodeAt(++e.position)) : s === 33 ? (n = !0, i = "!!", s = e.input.charCodeAt(++e.position)) : i = "!", t = e.position, r) {
    do
      s = e.input.charCodeAt(++e.position);
    while (s !== 0 && s !== 62);
    e.position < e.length ? (o = e.input.slice(t, e.position), s = e.input.charCodeAt(++e.position)) : x(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; s !== 0 && !xe(s); )
      s === 33 && (n ? x(e, "tag suffix cannot contain exclamation marks") : (i = e.input.slice(t - 1, e.position + 1), tf.test(i) || x(e, "named tag handle cannot contain such characters"), n = !0, t = e.position + 1)), s = e.input.charCodeAt(++e.position);
    o = e.input.slice(t, e.position), J0.test(o) && x(e, "tag suffix cannot contain flow indicator characters");
  }
  o && !rf.test(o) && x(e, "tag name cannot contain such characters: " + o);
  try {
    o = decodeURIComponent(o);
  } catch {
    x(e, "tag name is malformed: " + o);
  }
  return r ? e.tag = o : Tt.call(e.tagMap, i) ? e.tag = e.tagMap[i] + o : i === "!" ? e.tag = "!" + o : i === "!!" ? e.tag = "tag:yaml.org,2002:" + o : x(e, 'undeclared tag handle "' + i + '"'), !0;
}
function uE(e) {
  var t, r;
  if (r = e.input.charCodeAt(e.position), r !== 38) return !1;
  for (e.anchor !== null && x(e, "duplication of an anchor property"), r = e.input.charCodeAt(++e.position), t = e.position; r !== 0 && !xe(r) && !Zt(r); )
    r = e.input.charCodeAt(++e.position);
  return e.position === t && x(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0;
}
function fE(e) {
  var t, r, n;
  if (n = e.input.charCodeAt(e.position), n !== 42) return !1;
  for (n = e.input.charCodeAt(++e.position), t = e.position; n !== 0 && !xe(n) && !Zt(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === t && x(e, "name of an alias node must contain at least one character"), r = e.input.slice(t, e.position), Tt.call(e.anchorMap, r) || x(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], ue(e, !0, -1), !0;
}
function cr(e, t, r, n, i) {
  var o, s, a, l = 1, f = !1, c = !1, u, h, m, w, y, _;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, o = s = a = Yn === r || ef === r, n && ue(e, !0, -1) && (f = !0, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)), l === 1)
    for (; cE(e) || uE(e); )
      ue(e, !0, -1) ? (f = !0, a = o, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)) : a = !1;
  if (a && (a = f || i), (l === 1 || Yn === r) && (Wn === r || Zu === r ? y = t : y = t + 1, _ = e.position - e.lineStart, l === 1 ? a && (Ua(e, _) || lE(e, _, y)) || sE(e, y) ? c = !0 : (s && aE(e, y) || iE(e, y) || oE(e, y) ? c = !0 : fE(e) ? (c = !0, (e.tag !== null || e.anchor !== null) && x(e, "alias node should not have any properties")) : nE(e, y, Wn === r) && (c = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : l === 0 && (c = a && Ua(e, _))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && x(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), u = 0, h = e.implicitTypes.length; u < h; u += 1)
      if (w = e.implicitTypes[u], w.resolve(e.result)) {
        e.result = w.construct(e.result), e.tag = w.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (Tt.call(e.typeMap[e.kind || "fallback"], e.tag))
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
function dE(e) {
  var t = e.position, r, n, i, o = !1, s;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (s = e.input.charCodeAt(e.position)) !== 0 && (ue(e, !0, -1), s = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || s !== 37)); ) {
    for (o = !0, s = e.input.charCodeAt(++e.position), r = e.position; s !== 0 && !xe(s); )
      s = e.input.charCodeAt(++e.position);
    for (n = e.input.slice(r, e.position), i = [], n.length < 1 && x(e, "directive name must not be less than one character in length"); s !== 0; ) {
      for (; kt(s); )
        s = e.input.charCodeAt(++e.position);
      if (s === 35) {
        do
          s = e.input.charCodeAt(++e.position);
        while (s !== 0 && !Qe(s));
        break;
      }
      if (Qe(s)) break;
      for (r = e.position; s !== 0 && !xe(s); )
        s = e.input.charCodeAt(++e.position);
      i.push(e.input.slice(r, e.position));
    }
    s !== 0 && ys(e), Tt.call(La, n) ? La[n](e, n, i) : zn(e, 'unknown document directive "' + n + '"');
  }
  if (ue(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, ue(e, !0, -1)) : o && x(e, "directives end mark is expected"), cr(e, e.lineIndent - 1, Yn, !1, !0), ue(e, !0, -1), e.checkLineBreaks && K0.test(e.input.slice(t, e.position)) && zn(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && si(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, ue(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    x(e, "end of the stream or a document separator is expected");
  else
    return;
}
function af(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var r = new rE(e, t), n = e.indexOf("\0");
  for (n !== -1 && (r.position = n, x(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    dE(r);
  return r.documents;
}
function hE(e, t, r) {
  t !== null && typeof t == "object" && typeof r > "u" && (r = t, t = null);
  var n = af(e, r);
  if (typeof t != "function")
    return n;
  for (var i = 0, o = n.length; i < o; i += 1)
    t(n[i]);
}
function pE(e, t) {
  var r = af(e, t);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new Qu("expected a single document in the stream, but found more");
  }
}
ms.loadAll = hE;
ms.load = pE;
var lf = {}, ai = Ve, tn = en, mE = Es, cf = Object.prototype.toString, uf = Object.prototype.hasOwnProperty, ws = 65279, gE = 9, Mr = 10, EE = 13, yE = 32, vE = 33, wE = 34, qo = 35, _E = 37, TE = 38, SE = 39, AE = 42, ff = 44, bE = 45, Xn = 58, OE = 61, CE = 62, NE = 63, IE = 64, df = 91, hf = 93, RE = 96, pf = 123, $E = 124, mf = 125, be = {};
be[0] = "\\0";
be[7] = "\\a";
be[8] = "\\b";
be[9] = "\\t";
be[10] = "\\n";
be[11] = "\\v";
be[12] = "\\f";
be[13] = "\\r";
be[27] = "\\e";
be[34] = '\\"';
be[92] = "\\\\";
be[133] = "\\N";
be[160] = "\\_";
be[8232] = "\\L";
be[8233] = "\\P";
var DE = [
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
], PE = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function FE(e, t) {
  var r, n, i, o, s, a, l;
  if (t === null) return {};
  for (r = {}, n = Object.keys(t), i = 0, o = n.length; i < o; i += 1)
    s = n[i], a = String(t[s]), s.slice(0, 2) === "!!" && (s = "tag:yaml.org,2002:" + s.slice(2)), l = e.compiledTypeMap.fallback[s], l && uf.call(l.styleAliases, a) && (a = l.styleAliases[a]), r[s] = a;
  return r;
}
function LE(e) {
  var t, r, n;
  if (t = e.toString(16).toUpperCase(), e <= 255)
    r = "x", n = 2;
  else if (e <= 65535)
    r = "u", n = 4;
  else if (e <= 4294967295)
    r = "U", n = 8;
  else
    throw new tn("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + r + ai.repeat("0", n - t.length) + t;
}
var xE = 1, Br = 2;
function UE(e) {
  this.schema = e.schema || mE, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = ai.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = FE(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? Br : xE, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function ka(e, t) {
  for (var r = ai.repeat(" ", t), n = 0, i = -1, o = "", s, a = e.length; n < a; )
    i = e.indexOf(`
`, n), i === -1 ? (s = e.slice(n), n = a) : (s = e.slice(n, i + 1), n = i + 1), s.length && s !== `
` && (o += r), o += s;
  return o;
}
function Go(e, t) {
  return `
` + ai.repeat(" ", e.indent * t);
}
function kE(e, t) {
  var r, n, i;
  for (r = 0, n = e.implicitTypes.length; r < n; r += 1)
    if (i = e.implicitTypes[r], i.resolve(t))
      return !0;
  return !1;
}
function Kn(e) {
  return e === yE || e === gE;
}
function jr(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== ws || 65536 <= e && e <= 1114111;
}
function Ma(e) {
  return jr(e) && e !== ws && e !== EE && e !== Mr;
}
function Ba(e, t, r) {
  var n = Ma(e), i = n && !Kn(e);
  return (
    // ns-plain-safe
    (r ? (
      // c = flow-in
      n
    ) : n && e !== ff && e !== df && e !== hf && e !== pf && e !== mf) && e !== qo && !(t === Xn && !i) || Ma(t) && !Kn(t) && e === qo || t === Xn && i
  );
}
function ME(e) {
  return jr(e) && e !== ws && !Kn(e) && e !== bE && e !== NE && e !== Xn && e !== ff && e !== df && e !== hf && e !== pf && e !== mf && e !== qo && e !== TE && e !== AE && e !== vE && e !== $E && e !== OE && e !== CE && e !== SE && e !== wE && e !== _E && e !== IE && e !== RE;
}
function BE(e) {
  return !Kn(e) && e !== Xn;
}
function Cr(e, t) {
  var r = e.charCodeAt(t), n;
  return r >= 55296 && r <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1), n >= 56320 && n <= 57343) ? (r - 55296) * 1024 + n - 56320 + 65536 : r;
}
function gf(e) {
  var t = /^\n* /;
  return t.test(e);
}
var Ef = 1, Vo = 2, yf = 3, vf = 4, Qt = 5;
function jE(e, t, r, n, i, o, s, a) {
  var l, f = 0, c = null, u = !1, h = !1, m = n !== -1, w = -1, y = ME(Cr(e, 0)) && BE(Cr(e, e.length - 1));
  if (t || s)
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Cr(e, l), !jr(f))
        return Qt;
      y = y && Ba(f, c, a), c = f;
    }
  else {
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Cr(e, l), f === Mr)
        u = !0, m && (h = h || // Foldable line = too long, and not more-indented.
        l - w - 1 > n && e[w + 1] !== " ", w = l);
      else if (!jr(f))
        return Qt;
      y = y && Ba(f, c, a), c = f;
    }
    h = h || m && l - w - 1 > n && e[w + 1] !== " ";
  }
  return !u && !h ? y && !s && !i(e) ? Ef : o === Br ? Qt : Vo : r > 9 && gf(e) ? Qt : s ? o === Br ? Qt : Vo : h ? vf : yf;
}
function HE(e, t, r, n, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === Br ? '""' : "''";
    if (!e.noCompatMode && (DE.indexOf(t) !== -1 || PE.test(t)))
      return e.quotingType === Br ? '"' + t + '"' : "'" + t + "'";
    var o = e.indent * Math.max(1, r), s = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - o), a = n || e.flowLevel > -1 && r >= e.flowLevel;
    function l(f) {
      return kE(e, f);
    }
    switch (jE(
      t,
      a,
      e.indent,
      s,
      l,
      e.quotingType,
      e.forceQuotes && !n,
      i
    )) {
      case Ef:
        return t;
      case Vo:
        return "'" + t.replace(/'/g, "''") + "'";
      case yf:
        return "|" + ja(t, e.indent) + Ha(ka(t, o));
      case vf:
        return ">" + ja(t, e.indent) + Ha(ka(qE(t, s), o));
      case Qt:
        return '"' + GE(t) + '"';
      default:
        throw new tn("impossible error: invalid scalar style");
    }
  }();
}
function ja(e, t) {
  var r = gf(e) ? String(t) : "", n = e[e.length - 1] === `
`, i = n && (e[e.length - 2] === `
` || e === `
`), o = i ? "+" : n ? "" : "-";
  return r + o + `
`;
}
function Ha(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function qE(e, t) {
  for (var r = /(\n+)([^\n]*)/g, n = function() {
    var f = e.indexOf(`
`);
    return f = f !== -1 ? f : e.length, r.lastIndex = f, qa(e.slice(0, f), t);
  }(), i = e[0] === `
` || e[0] === " ", o, s; s = r.exec(e); ) {
    var a = s[1], l = s[2];
    o = l[0] === " ", n += a + (!i && !o && l !== "" ? `
` : "") + qa(l, t), i = o;
  }
  return n;
}
function qa(e, t) {
  if (e === "" || e[0] === " ") return e;
  for (var r = / [^ ]/g, n, i = 0, o, s = 0, a = 0, l = ""; n = r.exec(e); )
    a = n.index, a - i > t && (o = s > i ? s : a, l += `
` + e.slice(i, o), i = o + 1), s = a;
  return l += `
`, e.length - i > t && s > i ? l += e.slice(i, s) + `
` + e.slice(s + 1) : l += e.slice(i), l.slice(1);
}
function GE(e) {
  for (var t = "", r = 0, n, i = 0; i < e.length; r >= 65536 ? i += 2 : i++)
    r = Cr(e, i), n = be[r], !n && jr(r) ? (t += e[i], r >= 65536 && (t += e[i + 1])) : t += n || LE(r);
  return t;
}
function VE(e, t, r) {
  var n = "", i = e.tag, o, s, a;
  for (o = 0, s = r.length; o < s; o += 1)
    a = r[o], e.replacer && (a = e.replacer.call(r, String(o), a)), (it(e, t, a, !1, !1) || typeof a > "u" && it(e, t, null, !1, !1)) && (n !== "" && (n += "," + (e.condenseFlow ? "" : " ")), n += e.dump);
  e.tag = i, e.dump = "[" + n + "]";
}
function Ga(e, t, r, n) {
  var i = "", o = e.tag, s, a, l;
  for (s = 0, a = r.length; s < a; s += 1)
    l = r[s], e.replacer && (l = e.replacer.call(r, String(s), l)), (it(e, t + 1, l, !0, !0, !1, !0) || typeof l > "u" && it(e, t + 1, null, !0, !0, !1, !0)) && ((!n || i !== "") && (i += Go(e, t)), e.dump && Mr === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  e.tag = o, e.dump = i || "[]";
}
function WE(e, t, r) {
  var n = "", i = e.tag, o = Object.keys(r), s, a, l, f, c;
  for (s = 0, a = o.length; s < a; s += 1)
    c = "", n !== "" && (c += ", "), e.condenseFlow && (c += '"'), l = o[s], f = r[l], e.replacer && (f = e.replacer.call(r, l, f)), it(e, t, l, !1, !1) && (e.dump.length > 1024 && (c += "? "), c += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), it(e, t, f, !1, !1) && (c += e.dump, n += c));
  e.tag = i, e.dump = "{" + n + "}";
}
function YE(e, t, r, n) {
  var i = "", o = e.tag, s = Object.keys(r), a, l, f, c, u, h;
  if (e.sortKeys === !0)
    s.sort();
  else if (typeof e.sortKeys == "function")
    s.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new tn("sortKeys must be a boolean or a function");
  for (a = 0, l = s.length; a < l; a += 1)
    h = "", (!n || i !== "") && (h += Go(e, t)), f = s[a], c = r[f], e.replacer && (c = e.replacer.call(r, f, c)), it(e, t + 1, f, !0, !0, !0) && (u = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, u && (e.dump && Mr === e.dump.charCodeAt(0) ? h += "?" : h += "? "), h += e.dump, u && (h += Go(e, t)), it(e, t + 1, c, !0, u) && (e.dump && Mr === e.dump.charCodeAt(0) ? h += ":" : h += ": ", h += e.dump, i += h));
  e.tag = o, e.dump = i || "{}";
}
function Va(e, t, r) {
  var n, i, o, s, a, l;
  for (i = r ? e.explicitTypes : e.implicitTypes, o = 0, s = i.length; o < s; o += 1)
    if (a = i[o], (a.instanceOf || a.predicate) && (!a.instanceOf || typeof t == "object" && t instanceof a.instanceOf) && (!a.predicate || a.predicate(t))) {
      if (r ? a.multi && a.representName ? e.tag = a.representName(t) : e.tag = a.tag : e.tag = "?", a.represent) {
        if (l = e.styleMap[a.tag] || a.defaultStyle, cf.call(a.represent) === "[object Function]")
          n = a.represent(t, l);
        else if (uf.call(a.represent, l))
          n = a.represent[l](t, l);
        else
          throw new tn("!<" + a.tag + '> tag resolver accepts not "' + l + '" style');
        e.dump = n;
      }
      return !0;
    }
  return !1;
}
function it(e, t, r, n, i, o, s) {
  e.tag = null, e.dump = r, Va(e, r, !1) || Va(e, r, !0);
  var a = cf.call(e.dump), l = n, f;
  n && (n = e.flowLevel < 0 || e.flowLevel > t);
  var c = a === "[object Object]" || a === "[object Array]", u, h;
  if (c && (u = e.duplicates.indexOf(r), h = u !== -1), (e.tag !== null && e.tag !== "?" || h || e.indent !== 2 && t > 0) && (i = !1), h && e.usedDuplicates[u])
    e.dump = "*ref_" + u;
  else {
    if (c && h && !e.usedDuplicates[u] && (e.usedDuplicates[u] = !0), a === "[object Object]")
      n && Object.keys(e.dump).length !== 0 ? (YE(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (WE(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object Array]")
      n && e.dump.length !== 0 ? (e.noArrayIndent && !s && t > 0 ? Ga(e, t - 1, e.dump, i) : Ga(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (VE(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && HE(e, e.dump, t, o, l);
    else {
      if (a === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new tn("unacceptable kind of an object to dump " + a);
    }
    e.tag !== null && e.tag !== "?" && (f = encodeURI(
      e.tag[0] === "!" ? e.tag.slice(1) : e.tag
    ).replace(/!/g, "%21"), e.tag[0] === "!" ? f = "!" + f : f.slice(0, 18) === "tag:yaml.org,2002:" ? f = "!!" + f.slice(18) : f = "!<" + f + ">", e.dump = f + " " + e.dump);
  }
  return !0;
}
function zE(e, t) {
  var r = [], n = [], i, o;
  for (Wo(e, r, n), i = 0, o = n.length; i < o; i += 1)
    t.duplicates.push(r[n[i]]);
  t.usedDuplicates = new Array(o);
}
function Wo(e, t, r) {
  var n, i, o;
  if (e !== null && typeof e == "object")
    if (i = t.indexOf(e), i !== -1)
      r.indexOf(i) === -1 && r.push(i);
    else if (t.push(e), Array.isArray(e))
      for (i = 0, o = e.length; i < o; i += 1)
        Wo(e[i], t, r);
    else
      for (n = Object.keys(e), i = 0, o = n.length; i < o; i += 1)
        Wo(e[n[i]], t, r);
}
function XE(e, t) {
  t = t || {};
  var r = new UE(t);
  r.noRefs || zE(e, r);
  var n = e;
  return r.replacer && (n = r.replacer.call({ "": n }, "", n)), it(r, 0, n, !0, !0) ? r.dump + `
` : "";
}
lf.dump = XE;
var wf = ms, KE = lf;
function _s(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
_e.Type = Pe;
_e.Schema = Du;
_e.FAILSAFE_SCHEMA = xu;
_e.JSON_SCHEMA = Hu;
_e.CORE_SCHEMA = qu;
_e.DEFAULT_SCHEMA = Es;
_e.load = wf.load;
_e.loadAll = wf.loadAll;
_e.dump = KE.dump;
_e.YAMLException = en;
_e.types = {
  binary: zu,
  float: ju,
  map: Lu,
  null: Uu,
  pairs: Ku,
  set: Ju,
  timestamp: Wu,
  bool: ku,
  int: Mu,
  merge: Yu,
  omap: Xu,
  seq: Fu,
  str: Pu
};
_e.safeLoad = _s("safeLoad", "load");
_e.safeLoadAll = _s("safeLoadAll", "loadAll");
_e.safeDump = _s("safeDump", "dump");
var li = {};
Object.defineProperty(li, "__esModule", { value: !0 });
li.Lazy = void 0;
class JE {
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
li.Lazy = JE;
var Yo = { exports: {} };
const QE = "2.0.0", _f = 256, ZE = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, ey = 16, ty = _f - 6, ry = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var ci = {
  MAX_LENGTH: _f,
  MAX_SAFE_COMPONENT_LENGTH: ey,
  MAX_SAFE_BUILD_LENGTH: ty,
  MAX_SAFE_INTEGER: ZE,
  RELEASE_TYPES: ry,
  SEMVER_SPEC_VERSION: QE,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const ny = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var ui = ny;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: i
  } = ci, o = ui;
  t = e.exports = {};
  const s = t.re = [], a = t.safeRe = [], l = t.src = [], f = t.safeSrc = [], c = t.t = {};
  let u = 0;
  const h = "[a-zA-Z0-9-]", m = [
    ["\\s", 1],
    ["\\d", i],
    [h, n]
  ], w = (_) => {
    for (const [S, A] of m)
      _ = _.split(`${S}*`).join(`${S}{0,${A}}`).split(`${S}+`).join(`${S}{1,${A}}`);
    return _;
  }, y = (_, S, A) => {
    const D = w(S), L = u++;
    o(_, L, S), c[_] = L, l[L] = S, f[L] = D, s[L] = new RegExp(S, A ? "g" : void 0), a[L] = new RegExp(D, A ? "g" : void 0);
  };
  y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${h}*`), y("MAINVERSION", `(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${l[c.PRERELEASEIDENTIFIER]}(?:\\.${l[c.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${l[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[c.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${h}+`), y("BUILD", `(?:\\+(${l[c.BUILDIDENTIFIER]}(?:\\.${l[c.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${l[c.MAINVERSION]}${l[c.PRERELEASE]}?${l[c.BUILD]}?`), y("FULL", `^${l[c.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${l[c.MAINVERSIONLOOSE]}${l[c.PRERELEASELOOSE]}?${l[c.BUILD]}?`), y("LOOSE", `^${l[c.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${l[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${l[c.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:${l[c.PRERELEASE]})?${l[c.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:${l[c.PRERELEASELOOSE]})?${l[c.BUILD]}?)?)?`), y("XRANGE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), y("COERCE", `${l[c.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", l[c.COERCEPLAIN] + `(?:${l[c.PRERELEASE]})?(?:${l[c.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", l[c.COERCE], !0), y("COERCERTLFULL", l[c.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${l[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", y("TILDE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${l[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", y("CARET", `^${l[c.LONECARET]}${l[c.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${l[c.LONECARET]}${l[c.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${l[c.GTLT]}\\s*(${l[c.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]}|${l[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${l[c.XRANGEPLAIN]})\\s+-\\s+(${l[c.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${l[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[c.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(Yo, Yo.exports);
var rn = Yo.exports;
const iy = Object.freeze({ loose: !0 }), oy = Object.freeze({}), sy = (e) => e ? typeof e != "object" ? iy : e : oy;
var Ts = sy;
const Wa = /^[0-9]+$/, Tf = (e, t) => {
  const r = Wa.test(e), n = Wa.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, ay = (e, t) => Tf(t, e);
var Sf = {
  compareIdentifiers: Tf,
  rcompareIdentifiers: ay
};
const An = ui, { MAX_LENGTH: Ya, MAX_SAFE_INTEGER: bn } = ci, { safeRe: On, t: Cn } = rn, ly = Ts, { compareIdentifiers: Yt } = Sf;
let cy = class Ke {
  constructor(t, r) {
    if (r = ly(r), t instanceof Ke) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > Ya)
      throw new TypeError(
        `version is longer than ${Ya} characters`
      );
    An("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? On[Cn.LOOSE] : On[Cn.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > bn || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > bn || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > bn || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((i) => {
      if (/^[0-9]+$/.test(i)) {
        const o = +i;
        if (o >= 0 && o < bn)
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
    if (An("SemVer.compare", this.version, this.options, t), !(t instanceof Ke)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Ke(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Ke || (t = new Ke(t, this.options)), Yt(this.major, t.major) || Yt(this.minor, t.minor) || Yt(this.patch, t.patch);
  }
  comparePre(t) {
    if (t instanceof Ke || (t = new Ke(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], i = t.prerelease[r];
      if (An("prerelease compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return Yt(n, i);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Ke || (t = new Ke(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], i = t.build[r];
      if (An("build compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return Yt(n, i);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const i = `-${r}`.match(this.options.loose ? On[Cn.PRERELEASELOOSE] : On[Cn.PRERELEASE]);
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
          n === !1 && (o = [r]), Yt(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = o) : this.prerelease = o;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var Fe = cy;
const za = Fe, uy = (e, t, r = !1) => {
  if (e instanceof za)
    return e;
  try {
    return new za(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var pr = uy;
const fy = pr, dy = (e, t) => {
  const r = fy(e, t);
  return r ? r.version : null;
};
var hy = dy;
const py = pr, my = (e, t) => {
  const r = py(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var gy = my;
const Xa = Fe, Ey = (e, t, r, n, i) => {
  typeof r == "string" && (i = n, n = r, r = void 0);
  try {
    return new Xa(
      e instanceof Xa ? e.version : e,
      r
    ).inc(t, n, i).version;
  } catch {
    return null;
  }
};
var yy = Ey;
const Ka = pr, vy = (e, t) => {
  const r = Ka(e, null, !0), n = Ka(t, null, !0), i = r.compare(n);
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
var wy = vy;
const _y = Fe, Ty = (e, t) => new _y(e, t).major;
var Sy = Ty;
const Ay = Fe, by = (e, t) => new Ay(e, t).minor;
var Oy = by;
const Cy = Fe, Ny = (e, t) => new Cy(e, t).patch;
var Iy = Ny;
const Ry = pr, $y = (e, t) => {
  const r = Ry(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var Dy = $y;
const Ja = Fe, Py = (e, t, r) => new Ja(e, r).compare(new Ja(t, r));
var We = Py;
const Fy = We, Ly = (e, t, r) => Fy(t, e, r);
var xy = Ly;
const Uy = We, ky = (e, t) => Uy(e, t, !0);
var My = ky;
const Qa = Fe, By = (e, t, r) => {
  const n = new Qa(e, r), i = new Qa(t, r);
  return n.compare(i) || n.compareBuild(i);
};
var Ss = By;
const jy = Ss, Hy = (e, t) => e.sort((r, n) => jy(r, n, t));
var qy = Hy;
const Gy = Ss, Vy = (e, t) => e.sort((r, n) => Gy(n, r, t));
var Wy = Vy;
const Yy = We, zy = (e, t, r) => Yy(e, t, r) > 0;
var fi = zy;
const Xy = We, Ky = (e, t, r) => Xy(e, t, r) < 0;
var As = Ky;
const Jy = We, Qy = (e, t, r) => Jy(e, t, r) === 0;
var Af = Qy;
const Zy = We, ev = (e, t, r) => Zy(e, t, r) !== 0;
var bf = ev;
const tv = We, rv = (e, t, r) => tv(e, t, r) >= 0;
var bs = rv;
const nv = We, iv = (e, t, r) => nv(e, t, r) <= 0;
var Os = iv;
const ov = Af, sv = bf, av = fi, lv = bs, cv = As, uv = Os, fv = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return ov(e, r, n);
    case "!=":
      return sv(e, r, n);
    case ">":
      return av(e, r, n);
    case ">=":
      return lv(e, r, n);
    case "<":
      return cv(e, r, n);
    case "<=":
      return uv(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var Of = fv;
const dv = Fe, hv = pr, { safeRe: Nn, t: In } = rn, pv = (e, t) => {
  if (e instanceof dv)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? Nn[In.COERCEFULL] : Nn[In.COERCE]);
  else {
    const l = t.includePrerelease ? Nn[In.COERCERTLFULL] : Nn[In.COERCERTL];
    let f;
    for (; (f = l.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || f.index + f[0].length !== r.index + r[0].length) && (r = f), l.lastIndex = f.index + f[1].length + f[2].length;
    l.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], i = r[3] || "0", o = r[4] || "0", s = t.includePrerelease && r[5] ? `-${r[5]}` : "", a = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return hv(`${n}.${i}.${o}${s}${a}`, t);
};
var mv = pv;
class gv {
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
var Ev = gv, qi, Za;
function Ye() {
  if (Za) return qi;
  Za = 1;
  const e = /\s+/g;
  class t {
    constructor(C, $) {
      if ($ = i($), C instanceof t)
        return C.loose === !!$.loose && C.includePrerelease === !!$.includePrerelease ? C : new t(C.raw, $);
      if (C instanceof o)
        return this.raw = C.value, this.set = [[C]], this.formatted = void 0, this;
      if (this.options = $, this.loose = !!$.loose, this.includePrerelease = !!$.includePrerelease, this.raw = C.trim().replace(e, " "), this.set = this.raw.split("||").map((O) => this.parseRange(O.trim())).filter((O) => O.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const O = this.set[0];
        if (this.set = this.set.filter((P) => !y(P[0])), this.set.length === 0)
          this.set = [O];
        else if (this.set.length > 1) {
          for (const P of this.set)
            if (P.length === 1 && _(P[0])) {
              this.set = [P];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let C = 0; C < this.set.length; C++) {
          C > 0 && (this.formatted += "||");
          const $ = this.set[C];
          for (let O = 0; O < $.length; O++)
            O > 0 && (this.formatted += " "), this.formatted += $[O].toString().trim();
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
    parseRange(C) {
      const O = ((this.options.includePrerelease && m) | (this.options.loose && w)) + ":" + C, P = n.get(O);
      if (P)
        return P;
      const R = this.options.loose, k = R ? l[f.HYPHENRANGELOOSE] : l[f.HYPHENRANGE];
      C = C.replace(k, M(this.options.includePrerelease)), s("hyphen replace", C), C = C.replace(l[f.COMPARATORTRIM], c), s("comparator trim", C), C = C.replace(l[f.TILDETRIM], u), s("tilde trim", C), C = C.replace(l[f.CARETTRIM], h), s("caret trim", C);
      let z = C.split(" ").map((U) => A(U, this.options)).join(" ").split(/\s+/).map((U) => q(U, this.options));
      R && (z = z.filter((U) => (s("loose invalid filter", U, this.options), !!U.match(l[f.COMPARATORLOOSE])))), s("range list", z);
      const G = /* @__PURE__ */ new Map(), te = z.map((U) => new o(U, this.options));
      for (const U of te) {
        if (y(U))
          return [U];
        G.set(U.value, U);
      }
      G.size > 1 && G.has("") && G.delete("");
      const pe = [...G.values()];
      return n.set(O, pe), pe;
    }
    intersects(C, $) {
      if (!(C instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((O) => S(O, $) && C.set.some((P) => S(P, $) && O.every((R) => P.every((k) => R.intersects(k, $)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(C) {
      if (!C)
        return !1;
      if (typeof C == "string")
        try {
          C = new a(C, this.options);
        } catch {
          return !1;
        }
      for (let $ = 0; $ < this.set.length; $++)
        if (ee(this.set[$], C, this.options))
          return !0;
      return !1;
    }
  }
  qi = t;
  const r = Ev, n = new r(), i = Ts, o = di(), s = ui, a = Fe, {
    safeRe: l,
    t: f,
    comparatorTrimReplace: c,
    tildeTrimReplace: u,
    caretTrimReplace: h
  } = rn, { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: w } = ci, y = (I) => I.value === "<0.0.0-0", _ = (I) => I.value === "", S = (I, C) => {
    let $ = !0;
    const O = I.slice();
    let P = O.pop();
    for (; $ && O.length; )
      $ = O.every((R) => P.intersects(R, C)), P = O.pop();
    return $;
  }, A = (I, C) => (s("comp", I, C), I = H(I, C), s("caret", I), I = L(I, C), s("tildes", I), I = ce(I, C), s("xrange", I), I = Y(I, C), s("stars", I), I), D = (I) => !I || I.toLowerCase() === "x" || I === "*", L = (I, C) => I.trim().split(/\s+/).map(($) => j($, C)).join(" "), j = (I, C) => {
    const $ = C.loose ? l[f.TILDELOOSE] : l[f.TILDE];
    return I.replace($, (O, P, R, k, z) => {
      s("tilde", I, O, P, R, k, z);
      let G;
      return D(P) ? G = "" : D(R) ? G = `>=${P}.0.0 <${+P + 1}.0.0-0` : D(k) ? G = `>=${P}.${R}.0 <${P}.${+R + 1}.0-0` : z ? (s("replaceTilde pr", z), G = `>=${P}.${R}.${k}-${z} <${P}.${+R + 1}.0-0`) : G = `>=${P}.${R}.${k} <${P}.${+R + 1}.0-0`, s("tilde return", G), G;
    });
  }, H = (I, C) => I.trim().split(/\s+/).map(($) => B($, C)).join(" "), B = (I, C) => {
    s("caret", I, C);
    const $ = C.loose ? l[f.CARETLOOSE] : l[f.CARET], O = C.includePrerelease ? "-0" : "";
    return I.replace($, (P, R, k, z, G) => {
      s("caret", I, P, R, k, z, G);
      let te;
      return D(R) ? te = "" : D(k) ? te = `>=${R}.0.0${O} <${+R + 1}.0.0-0` : D(z) ? R === "0" ? te = `>=${R}.${k}.0${O} <${R}.${+k + 1}.0-0` : te = `>=${R}.${k}.0${O} <${+R + 1}.0.0-0` : G ? (s("replaceCaret pr", G), R === "0" ? k === "0" ? te = `>=${R}.${k}.${z}-${G} <${R}.${k}.${+z + 1}-0` : te = `>=${R}.${k}.${z}-${G} <${R}.${+k + 1}.0-0` : te = `>=${R}.${k}.${z}-${G} <${+R + 1}.0.0-0`) : (s("no pr"), R === "0" ? k === "0" ? te = `>=${R}.${k}.${z}${O} <${R}.${k}.${+z + 1}-0` : te = `>=${R}.${k}.${z}${O} <${R}.${+k + 1}.0-0` : te = `>=${R}.${k}.${z} <${+R + 1}.0.0-0`), s("caret return", te), te;
    });
  }, ce = (I, C) => (s("replaceXRanges", I, C), I.split(/\s+/).map(($) => E($, C)).join(" ")), E = (I, C) => {
    I = I.trim();
    const $ = C.loose ? l[f.XRANGELOOSE] : l[f.XRANGE];
    return I.replace($, (O, P, R, k, z, G) => {
      s("xRange", I, O, P, R, k, z, G);
      const te = D(R), pe = te || D(k), U = pe || D(z), ze = U;
      return P === "=" && ze && (P = ""), G = C.includePrerelease ? "-0" : "", te ? P === ">" || P === "<" ? O = "<0.0.0-0" : O = "*" : P && ze ? (pe && (k = 0), z = 0, P === ">" ? (P = ">=", pe ? (R = +R + 1, k = 0, z = 0) : (k = +k + 1, z = 0)) : P === "<=" && (P = "<", pe ? R = +R + 1 : k = +k + 1), P === "<" && (G = "-0"), O = `${P + R}.${k}.${z}${G}`) : pe ? O = `>=${R}.0.0${G} <${+R + 1}.0.0-0` : U && (O = `>=${R}.${k}.0${G} <${R}.${+k + 1}.0-0`), s("xRange return", O), O;
    });
  }, Y = (I, C) => (s("replaceStars", I, C), I.trim().replace(l[f.STAR], "")), q = (I, C) => (s("replaceGTE0", I, C), I.trim().replace(l[C.includePrerelease ? f.GTE0PRE : f.GTE0], "")), M = (I) => (C, $, O, P, R, k, z, G, te, pe, U, ze) => (D(O) ? $ = "" : D(P) ? $ = `>=${O}.0.0${I ? "-0" : ""}` : D(R) ? $ = `>=${O}.${P}.0${I ? "-0" : ""}` : k ? $ = `>=${$}` : $ = `>=${$}${I ? "-0" : ""}`, D(te) ? G = "" : D(pe) ? G = `<${+te + 1}.0.0-0` : D(U) ? G = `<${te}.${+pe + 1}.0-0` : ze ? G = `<=${te}.${pe}.${U}-${ze}` : I ? G = `<${te}.${pe}.${+U + 1}-0` : G = `<=${G}`, `${$} ${G}`.trim()), ee = (I, C, $) => {
    for (let O = 0; O < I.length; O++)
      if (!I[O].test(C))
        return !1;
    if (C.prerelease.length && !$.includePrerelease) {
      for (let O = 0; O < I.length; O++)
        if (s(I[O].semver), I[O].semver !== o.ANY && I[O].semver.prerelease.length > 0) {
          const P = I[O].semver;
          if (P.major === C.major && P.minor === C.minor && P.patch === C.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return qi;
}
var Gi, el;
function di() {
  if (el) return Gi;
  el = 1;
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
  Gi = t;
  const r = Ts, { safeRe: n, t: i } = rn, o = Of, s = ui, a = Fe, l = Ye();
  return Gi;
}
const yv = Ye(), vv = (e, t, r) => {
  try {
    t = new yv(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var hi = vv;
const wv = Ye(), _v = (e, t) => new wv(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var Tv = _v;
const Sv = Fe, Av = Ye(), bv = (e, t, r) => {
  let n = null, i = null, o = null;
  try {
    o = new Av(t, r);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!n || i.compare(s) === -1) && (n = s, i = new Sv(n, r));
  }), n;
};
var Ov = bv;
const Cv = Fe, Nv = Ye(), Iv = (e, t, r) => {
  let n = null, i = null, o = null;
  try {
    o = new Nv(t, r);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!n || i.compare(s) === 1) && (n = s, i = new Cv(n, r));
  }), n;
};
var Rv = Iv;
const Vi = Fe, $v = Ye(), tl = fi, Dv = (e, t) => {
  e = new $v(e, t);
  let r = new Vi("0.0.0");
  if (e.test(r) || (r = new Vi("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const i = e.set[n];
    let o = null;
    i.forEach((s) => {
      const a = new Vi(s.semver.version);
      switch (s.operator) {
        case ">":
          a.prerelease.length === 0 ? a.patch++ : a.prerelease.push(0), a.raw = a.format();
        case "":
        case ">=":
          (!o || tl(a, o)) && (o = a);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${s.operator}`);
      }
    }), o && (!r || tl(r, o)) && (r = o);
  }
  return r && e.test(r) ? r : null;
};
var Pv = Dv;
const Fv = Ye(), Lv = (e, t) => {
  try {
    return new Fv(e, t).range || "*";
  } catch {
    return null;
  }
};
var xv = Lv;
const Uv = Fe, Cf = di(), { ANY: kv } = Cf, Mv = Ye(), Bv = hi, rl = fi, nl = As, jv = Os, Hv = bs, qv = (e, t, r, n) => {
  e = new Uv(e, n), t = new Mv(t, n);
  let i, o, s, a, l;
  switch (r) {
    case ">":
      i = rl, o = jv, s = nl, a = ">", l = ">=";
      break;
    case "<":
      i = nl, o = Hv, s = rl, a = "<", l = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (Bv(e, t, n))
    return !1;
  for (let f = 0; f < t.set.length; ++f) {
    const c = t.set[f];
    let u = null, h = null;
    if (c.forEach((m) => {
      m.semver === kv && (m = new Cf(">=0.0.0")), u = u || m, h = h || m, i(m.semver, u.semver, n) ? u = m : s(m.semver, h.semver, n) && (h = m);
    }), u.operator === a || u.operator === l || (!h.operator || h.operator === a) && o(e, h.semver))
      return !1;
    if (h.operator === l && s(e, h.semver))
      return !1;
  }
  return !0;
};
var Cs = qv;
const Gv = Cs, Vv = (e, t, r) => Gv(e, t, ">", r);
var Wv = Vv;
const Yv = Cs, zv = (e, t, r) => Yv(e, t, "<", r);
var Xv = zv;
const il = Ye(), Kv = (e, t, r) => (e = new il(e, r), t = new il(t, r), e.intersects(t, r));
var Jv = Kv;
const Qv = hi, Zv = We;
var ew = (e, t, r) => {
  const n = [];
  let i = null, o = null;
  const s = e.sort((c, u) => Zv(c, u, r));
  for (const c of s)
    Qv(c, t, r) ? (o = c, i || (i = c)) : (o && n.push([i, o]), o = null, i = null);
  i && n.push([i, null]);
  const a = [];
  for (const [c, u] of n)
    c === u ? a.push(c) : !u && c === s[0] ? a.push("*") : u ? c === s[0] ? a.push(`<=${u}`) : a.push(`${c} - ${u}`) : a.push(`>=${c}`);
  const l = a.join(" || "), f = typeof t.raw == "string" ? t.raw : String(t);
  return l.length < f.length ? l : t;
};
const ol = Ye(), Ns = di(), { ANY: Wi } = Ns, Sr = hi, Is = We, tw = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new ol(e, r), t = new ol(t, r);
  let n = !1;
  e: for (const i of e.set) {
    for (const o of t.set) {
      const s = nw(i, o, r);
      if (n = n || s !== null, s)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, rw = [new Ns(">=0.0.0-0")], sl = [new Ns(">=0.0.0")], nw = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === Wi) {
    if (t.length === 1 && t[0].semver === Wi)
      return !0;
    r.includePrerelease ? e = rw : e = sl;
  }
  if (t.length === 1 && t[0].semver === Wi) {
    if (r.includePrerelease)
      return !0;
    t = sl;
  }
  const n = /* @__PURE__ */ new Set();
  let i, o;
  for (const m of e)
    m.operator === ">" || m.operator === ">=" ? i = al(i, m, r) : m.operator === "<" || m.operator === "<=" ? o = ll(o, m, r) : n.add(m.semver);
  if (n.size > 1)
    return null;
  let s;
  if (i && o) {
    if (s = Is(i.semver, o.semver, r), s > 0)
      return null;
    if (s === 0 && (i.operator !== ">=" || o.operator !== "<="))
      return null;
  }
  for (const m of n) {
    if (i && !Sr(m, String(i), r) || o && !Sr(m, String(o), r))
      return null;
    for (const w of t)
      if (!Sr(m, String(w), r))
        return !1;
    return !0;
  }
  let a, l, f, c, u = o && !r.includePrerelease && o.semver.prerelease.length ? o.semver : !1, h = i && !r.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  u && u.prerelease.length === 1 && o.operator === "<" && u.prerelease[0] === 0 && (u = !1);
  for (const m of t) {
    if (c = c || m.operator === ">" || m.operator === ">=", f = f || m.operator === "<" || m.operator === "<=", i) {
      if (h && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === h.major && m.semver.minor === h.minor && m.semver.patch === h.patch && (h = !1), m.operator === ">" || m.operator === ">=") {
        if (a = al(i, m, r), a === m && a !== i)
          return !1;
      } else if (i.operator === ">=" && !Sr(i.semver, String(m), r))
        return !1;
    }
    if (o) {
      if (u && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === u.major && m.semver.minor === u.minor && m.semver.patch === u.patch && (u = !1), m.operator === "<" || m.operator === "<=") {
        if (l = ll(o, m, r), l === m && l !== o)
          return !1;
      } else if (o.operator === "<=" && !Sr(o.semver, String(m), r))
        return !1;
    }
    if (!m.operator && (o || i) && s !== 0)
      return !1;
  }
  return !(i && f && !o && s !== 0 || o && c && !i && s !== 0 || h || u);
}, al = (e, t, r) => {
  if (!e)
    return t;
  const n = Is(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, ll = (e, t, r) => {
  if (!e)
    return t;
  const n = Is(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var iw = tw;
const Yi = rn, cl = ci, ow = Fe, ul = Sf, sw = pr, aw = hy, lw = gy, cw = yy, uw = wy, fw = Sy, dw = Oy, hw = Iy, pw = Dy, mw = We, gw = xy, Ew = My, yw = Ss, vw = qy, ww = Wy, _w = fi, Tw = As, Sw = Af, Aw = bf, bw = bs, Ow = Os, Cw = Of, Nw = mv, Iw = di(), Rw = Ye(), $w = hi, Dw = Tv, Pw = Ov, Fw = Rv, Lw = Pv, xw = xv, Uw = Cs, kw = Wv, Mw = Xv, Bw = Jv, jw = ew, Hw = iw;
var Nf = {
  parse: sw,
  valid: aw,
  clean: lw,
  inc: cw,
  diff: uw,
  major: fw,
  minor: dw,
  patch: hw,
  prerelease: pw,
  compare: mw,
  rcompare: gw,
  compareLoose: Ew,
  compareBuild: yw,
  sort: vw,
  rsort: ww,
  gt: _w,
  lt: Tw,
  eq: Sw,
  neq: Aw,
  gte: bw,
  lte: Ow,
  cmp: Cw,
  coerce: Nw,
  Comparator: Iw,
  Range: Rw,
  satisfies: $w,
  toComparators: Dw,
  maxSatisfying: Pw,
  minSatisfying: Fw,
  minVersion: Lw,
  validRange: xw,
  outside: Uw,
  gtr: kw,
  ltr: Mw,
  intersects: Bw,
  simplifyRange: jw,
  subset: Hw,
  SemVer: ow,
  re: Yi.re,
  src: Yi.src,
  tokens: Yi.t,
  SEMVER_SPEC_VERSION: cl.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: cl.RELEASE_TYPES,
  compareIdentifiers: ul.compareIdentifiers,
  rcompareIdentifiers: ul.rcompareIdentifiers
}, nn = {}, Jn = { exports: {} };
Jn.exports;
(function(e, t) {
  var r = 200, n = "__lodash_hash_undefined__", i = 1, o = 2, s = 9007199254740991, a = "[object Arguments]", l = "[object Array]", f = "[object AsyncFunction]", c = "[object Boolean]", u = "[object Date]", h = "[object Error]", m = "[object Function]", w = "[object GeneratorFunction]", y = "[object Map]", _ = "[object Number]", S = "[object Null]", A = "[object Object]", D = "[object Promise]", L = "[object Proxy]", j = "[object RegExp]", H = "[object Set]", B = "[object String]", ce = "[object Symbol]", E = "[object Undefined]", Y = "[object WeakMap]", q = "[object ArrayBuffer]", M = "[object DataView]", ee = "[object Float32Array]", I = "[object Float64Array]", C = "[object Int8Array]", $ = "[object Int16Array]", O = "[object Int32Array]", P = "[object Uint8Array]", R = "[object Uint8ClampedArray]", k = "[object Uint16Array]", z = "[object Uint32Array]", G = /[\\^$.*+?()[\]{}|]/g, te = /^\[object .+?Constructor\]$/, pe = /^(?:0|[1-9]\d*)$/, U = {};
  U[ee] = U[I] = U[C] = U[$] = U[O] = U[P] = U[R] = U[k] = U[z] = !0, U[a] = U[l] = U[q] = U[c] = U[M] = U[u] = U[h] = U[m] = U[y] = U[_] = U[A] = U[j] = U[H] = U[B] = U[Y] = !1;
  var ze = typeof Ce == "object" && Ce && Ce.Object === Object && Ce, p = typeof self == "object" && self && self.Object === Object && self, d = ze || p || Function("return this")(), b = t && !t.nodeType && t, T = b && !0 && e && !e.nodeType && e, J = T && T.exports === b, ie = J && ze.process, ae = function() {
    try {
      return ie && ie.binding && ie.binding("util");
    } catch {
    }
  }(), ye = ae && ae.isTypedArray;
  function Te(g, v) {
    for (var N = -1, F = g == null ? 0 : g.length, ne = 0, V = []; ++N < F; ) {
      var le = g[N];
      v(le, N, g) && (V[ne++] = le);
    }
    return V;
  }
  function lt(g, v) {
    for (var N = -1, F = v.length, ne = g.length; ++N < F; )
      g[ne + N] = v[N];
    return g;
  }
  function fe(g, v) {
    for (var N = -1, F = g == null ? 0 : g.length; ++N < F; )
      if (v(g[N], N, g))
        return !0;
    return !1;
  }
  function je(g, v) {
    for (var N = -1, F = Array(g); ++N < g; )
      F[N] = v(N);
    return F;
  }
  function Si(g) {
    return function(v) {
      return g(v);
    };
  }
  function ln(g, v) {
    return g.has(v);
  }
  function gr(g, v) {
    return g == null ? void 0 : g[v];
  }
  function cn(g) {
    var v = -1, N = Array(g.size);
    return g.forEach(function(F, ne) {
      N[++v] = [ne, F];
    }), N;
  }
  function Kf(g, v) {
    return function(N) {
      return g(v(N));
    };
  }
  function Jf(g) {
    var v = -1, N = Array(g.size);
    return g.forEach(function(F) {
      N[++v] = F;
    }), N;
  }
  var Qf = Array.prototype, Zf = Function.prototype, un = Object.prototype, Ai = d["__core-js_shared__"], Ls = Zf.toString, Xe = un.hasOwnProperty, xs = function() {
    var g = /[^.]+$/.exec(Ai && Ai.keys && Ai.keys.IE_PROTO || "");
    return g ? "Symbol(src)_1." + g : "";
  }(), Us = un.toString, ed = RegExp(
    "^" + Ls.call(Xe).replace(G, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), ks = J ? d.Buffer : void 0, fn = d.Symbol, Ms = d.Uint8Array, Bs = un.propertyIsEnumerable, td = Qf.splice, Ct = fn ? fn.toStringTag : void 0, js = Object.getOwnPropertySymbols, rd = ks ? ks.isBuffer : void 0, nd = Kf(Object.keys, Object), bi = Gt(d, "DataView"), Er = Gt(d, "Map"), Oi = Gt(d, "Promise"), Ci = Gt(d, "Set"), Ni = Gt(d, "WeakMap"), yr = Gt(Object, "create"), id = Rt(bi), od = Rt(Er), sd = Rt(Oi), ad = Rt(Ci), ld = Rt(Ni), Hs = fn ? fn.prototype : void 0, Ii = Hs ? Hs.valueOf : void 0;
  function Nt(g) {
    var v = -1, N = g == null ? 0 : g.length;
    for (this.clear(); ++v < N; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function cd() {
    this.__data__ = yr ? yr(null) : {}, this.size = 0;
  }
  function ud(g) {
    var v = this.has(g) && delete this.__data__[g];
    return this.size -= v ? 1 : 0, v;
  }
  function fd(g) {
    var v = this.__data__;
    if (yr) {
      var N = v[g];
      return N === n ? void 0 : N;
    }
    return Xe.call(v, g) ? v[g] : void 0;
  }
  function dd(g) {
    var v = this.__data__;
    return yr ? v[g] !== void 0 : Xe.call(v, g);
  }
  function hd(g, v) {
    var N = this.__data__;
    return this.size += this.has(g) ? 0 : 1, N[g] = yr && v === void 0 ? n : v, this;
  }
  Nt.prototype.clear = cd, Nt.prototype.delete = ud, Nt.prototype.get = fd, Nt.prototype.has = dd, Nt.prototype.set = hd;
  function et(g) {
    var v = -1, N = g == null ? 0 : g.length;
    for (this.clear(); ++v < N; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function pd() {
    this.__data__ = [], this.size = 0;
  }
  function md(g) {
    var v = this.__data__, N = hn(v, g);
    if (N < 0)
      return !1;
    var F = v.length - 1;
    return N == F ? v.pop() : td.call(v, N, 1), --this.size, !0;
  }
  function gd(g) {
    var v = this.__data__, N = hn(v, g);
    return N < 0 ? void 0 : v[N][1];
  }
  function Ed(g) {
    return hn(this.__data__, g) > -1;
  }
  function yd(g, v) {
    var N = this.__data__, F = hn(N, g);
    return F < 0 ? (++this.size, N.push([g, v])) : N[F][1] = v, this;
  }
  et.prototype.clear = pd, et.prototype.delete = md, et.prototype.get = gd, et.prototype.has = Ed, et.prototype.set = yd;
  function It(g) {
    var v = -1, N = g == null ? 0 : g.length;
    for (this.clear(); ++v < N; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function vd() {
    this.size = 0, this.__data__ = {
      hash: new Nt(),
      map: new (Er || et)(),
      string: new Nt()
    };
  }
  function wd(g) {
    var v = pn(this, g).delete(g);
    return this.size -= v ? 1 : 0, v;
  }
  function _d(g) {
    return pn(this, g).get(g);
  }
  function Td(g) {
    return pn(this, g).has(g);
  }
  function Sd(g, v) {
    var N = pn(this, g), F = N.size;
    return N.set(g, v), this.size += N.size == F ? 0 : 1, this;
  }
  It.prototype.clear = vd, It.prototype.delete = wd, It.prototype.get = _d, It.prototype.has = Td, It.prototype.set = Sd;
  function dn(g) {
    var v = -1, N = g == null ? 0 : g.length;
    for (this.__data__ = new It(); ++v < N; )
      this.add(g[v]);
  }
  function Ad(g) {
    return this.__data__.set(g, n), this;
  }
  function bd(g) {
    return this.__data__.has(g);
  }
  dn.prototype.add = dn.prototype.push = Ad, dn.prototype.has = bd;
  function ct(g) {
    var v = this.__data__ = new et(g);
    this.size = v.size;
  }
  function Od() {
    this.__data__ = new et(), this.size = 0;
  }
  function Cd(g) {
    var v = this.__data__, N = v.delete(g);
    return this.size = v.size, N;
  }
  function Nd(g) {
    return this.__data__.get(g);
  }
  function Id(g) {
    return this.__data__.has(g);
  }
  function Rd(g, v) {
    var N = this.__data__;
    if (N instanceof et) {
      var F = N.__data__;
      if (!Er || F.length < r - 1)
        return F.push([g, v]), this.size = ++N.size, this;
      N = this.__data__ = new It(F);
    }
    return N.set(g, v), this.size = N.size, this;
  }
  ct.prototype.clear = Od, ct.prototype.delete = Cd, ct.prototype.get = Nd, ct.prototype.has = Id, ct.prototype.set = Rd;
  function $d(g, v) {
    var N = mn(g), F = !N && Wd(g), ne = !N && !F && Ri(g), V = !N && !F && !ne && Js(g), le = N || F || ne || V, me = le ? je(g.length, String) : [], ve = me.length;
    for (var oe in g)
      Xe.call(g, oe) && !(le && // Safari 9 has enumerable `arguments.length` in strict mode.
      (oe == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      ne && (oe == "offset" || oe == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      V && (oe == "buffer" || oe == "byteLength" || oe == "byteOffset") || // Skip index properties.
      jd(oe, ve))) && me.push(oe);
    return me;
  }
  function hn(g, v) {
    for (var N = g.length; N--; )
      if (Ys(g[N][0], v))
        return N;
    return -1;
  }
  function Dd(g, v, N) {
    var F = v(g);
    return mn(g) ? F : lt(F, N(g));
  }
  function vr(g) {
    return g == null ? g === void 0 ? E : S : Ct && Ct in Object(g) ? Md(g) : Vd(g);
  }
  function qs(g) {
    return wr(g) && vr(g) == a;
  }
  function Gs(g, v, N, F, ne) {
    return g === v ? !0 : g == null || v == null || !wr(g) && !wr(v) ? g !== g && v !== v : Pd(g, v, N, F, Gs, ne);
  }
  function Pd(g, v, N, F, ne, V) {
    var le = mn(g), me = mn(v), ve = le ? l : ut(g), oe = me ? l : ut(v);
    ve = ve == a ? A : ve, oe = oe == a ? A : oe;
    var Ue = ve == A, He = oe == A, Se = ve == oe;
    if (Se && Ri(g)) {
      if (!Ri(v))
        return !1;
      le = !0, Ue = !1;
    }
    if (Se && !Ue)
      return V || (V = new ct()), le || Js(g) ? Vs(g, v, N, F, ne, V) : Ud(g, v, ve, N, F, ne, V);
    if (!(N & i)) {
      var ke = Ue && Xe.call(g, "__wrapped__"), Me = He && Xe.call(v, "__wrapped__");
      if (ke || Me) {
        var ft = ke ? g.value() : g, tt = Me ? v.value() : v;
        return V || (V = new ct()), ne(ft, tt, N, F, V);
      }
    }
    return Se ? (V || (V = new ct()), kd(g, v, N, F, ne, V)) : !1;
  }
  function Fd(g) {
    if (!Ks(g) || qd(g))
      return !1;
    var v = zs(g) ? ed : te;
    return v.test(Rt(g));
  }
  function Ld(g) {
    return wr(g) && Xs(g.length) && !!U[vr(g)];
  }
  function xd(g) {
    if (!Gd(g))
      return nd(g);
    var v = [];
    for (var N in Object(g))
      Xe.call(g, N) && N != "constructor" && v.push(N);
    return v;
  }
  function Vs(g, v, N, F, ne, V) {
    var le = N & i, me = g.length, ve = v.length;
    if (me != ve && !(le && ve > me))
      return !1;
    var oe = V.get(g);
    if (oe && V.get(v))
      return oe == v;
    var Ue = -1, He = !0, Se = N & o ? new dn() : void 0;
    for (V.set(g, v), V.set(v, g); ++Ue < me; ) {
      var ke = g[Ue], Me = v[Ue];
      if (F)
        var ft = le ? F(Me, ke, Ue, v, g, V) : F(ke, Me, Ue, g, v, V);
      if (ft !== void 0) {
        if (ft)
          continue;
        He = !1;
        break;
      }
      if (Se) {
        if (!fe(v, function(tt, $t) {
          if (!ln(Se, $t) && (ke === tt || ne(ke, tt, N, F, V)))
            return Se.push($t);
        })) {
          He = !1;
          break;
        }
      } else if (!(ke === Me || ne(ke, Me, N, F, V))) {
        He = !1;
        break;
      }
    }
    return V.delete(g), V.delete(v), He;
  }
  function Ud(g, v, N, F, ne, V, le) {
    switch (N) {
      case M:
        if (g.byteLength != v.byteLength || g.byteOffset != v.byteOffset)
          return !1;
        g = g.buffer, v = v.buffer;
      case q:
        return !(g.byteLength != v.byteLength || !V(new Ms(g), new Ms(v)));
      case c:
      case u:
      case _:
        return Ys(+g, +v);
      case h:
        return g.name == v.name && g.message == v.message;
      case j:
      case B:
        return g == v + "";
      case y:
        var me = cn;
      case H:
        var ve = F & i;
        if (me || (me = Jf), g.size != v.size && !ve)
          return !1;
        var oe = le.get(g);
        if (oe)
          return oe == v;
        F |= o, le.set(g, v);
        var Ue = Vs(me(g), me(v), F, ne, V, le);
        return le.delete(g), Ue;
      case ce:
        if (Ii)
          return Ii.call(g) == Ii.call(v);
    }
    return !1;
  }
  function kd(g, v, N, F, ne, V) {
    var le = N & i, me = Ws(g), ve = me.length, oe = Ws(v), Ue = oe.length;
    if (ve != Ue && !le)
      return !1;
    for (var He = ve; He--; ) {
      var Se = me[He];
      if (!(le ? Se in v : Xe.call(v, Se)))
        return !1;
    }
    var ke = V.get(g);
    if (ke && V.get(v))
      return ke == v;
    var Me = !0;
    V.set(g, v), V.set(v, g);
    for (var ft = le; ++He < ve; ) {
      Se = me[He];
      var tt = g[Se], $t = v[Se];
      if (F)
        var Qs = le ? F($t, tt, Se, v, g, V) : F(tt, $t, Se, g, v, V);
      if (!(Qs === void 0 ? tt === $t || ne(tt, $t, N, F, V) : Qs)) {
        Me = !1;
        break;
      }
      ft || (ft = Se == "constructor");
    }
    if (Me && !ft) {
      var gn = g.constructor, En = v.constructor;
      gn != En && "constructor" in g && "constructor" in v && !(typeof gn == "function" && gn instanceof gn && typeof En == "function" && En instanceof En) && (Me = !1);
    }
    return V.delete(g), V.delete(v), Me;
  }
  function Ws(g) {
    return Dd(g, Xd, Bd);
  }
  function pn(g, v) {
    var N = g.__data__;
    return Hd(v) ? N[typeof v == "string" ? "string" : "hash"] : N.map;
  }
  function Gt(g, v) {
    var N = gr(g, v);
    return Fd(N) ? N : void 0;
  }
  function Md(g) {
    var v = Xe.call(g, Ct), N = g[Ct];
    try {
      g[Ct] = void 0;
      var F = !0;
    } catch {
    }
    var ne = Us.call(g);
    return F && (v ? g[Ct] = N : delete g[Ct]), ne;
  }
  var Bd = js ? function(g) {
    return g == null ? [] : (g = Object(g), Te(js(g), function(v) {
      return Bs.call(g, v);
    }));
  } : Kd, ut = vr;
  (bi && ut(new bi(new ArrayBuffer(1))) != M || Er && ut(new Er()) != y || Oi && ut(Oi.resolve()) != D || Ci && ut(new Ci()) != H || Ni && ut(new Ni()) != Y) && (ut = function(g) {
    var v = vr(g), N = v == A ? g.constructor : void 0, F = N ? Rt(N) : "";
    if (F)
      switch (F) {
        case id:
          return M;
        case od:
          return y;
        case sd:
          return D;
        case ad:
          return H;
        case ld:
          return Y;
      }
    return v;
  });
  function jd(g, v) {
    return v = v ?? s, !!v && (typeof g == "number" || pe.test(g)) && g > -1 && g % 1 == 0 && g < v;
  }
  function Hd(g) {
    var v = typeof g;
    return v == "string" || v == "number" || v == "symbol" || v == "boolean" ? g !== "__proto__" : g === null;
  }
  function qd(g) {
    return !!xs && xs in g;
  }
  function Gd(g) {
    var v = g && g.constructor, N = typeof v == "function" && v.prototype || un;
    return g === N;
  }
  function Vd(g) {
    return Us.call(g);
  }
  function Rt(g) {
    if (g != null) {
      try {
        return Ls.call(g);
      } catch {
      }
      try {
        return g + "";
      } catch {
      }
    }
    return "";
  }
  function Ys(g, v) {
    return g === v || g !== g && v !== v;
  }
  var Wd = qs(/* @__PURE__ */ function() {
    return arguments;
  }()) ? qs : function(g) {
    return wr(g) && Xe.call(g, "callee") && !Bs.call(g, "callee");
  }, mn = Array.isArray;
  function Yd(g) {
    return g != null && Xs(g.length) && !zs(g);
  }
  var Ri = rd || Jd;
  function zd(g, v) {
    return Gs(g, v);
  }
  function zs(g) {
    if (!Ks(g))
      return !1;
    var v = vr(g);
    return v == m || v == w || v == f || v == L;
  }
  function Xs(g) {
    return typeof g == "number" && g > -1 && g % 1 == 0 && g <= s;
  }
  function Ks(g) {
    var v = typeof g;
    return g != null && (v == "object" || v == "function");
  }
  function wr(g) {
    return g != null && typeof g == "object";
  }
  var Js = ye ? Si(ye) : Ld;
  function Xd(g) {
    return Yd(g) ? $d(g) : xd(g);
  }
  function Kd() {
    return [];
  }
  function Jd() {
    return !1;
  }
  e.exports = zd;
})(Jn, Jn.exports);
var qw = Jn.exports;
Object.defineProperty(nn, "__esModule", { value: !0 });
nn.DownloadedUpdateHelper = void 0;
nn.createTempUpdateFile = zw;
const Gw = ur, Vw = Re, fl = qw, Pt = bt, $r = Q;
class Ww {
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
      return fl(this.versionInfo, r) && fl(this.fileInfo.info, n.info) && await (0, Pt.pathExists)(t) ? t : null;
    const o = await this.getValidCachedUpdateFile(n, i);
    return o === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = o, o);
  }
  async setDownloadedFile(t, r, n, i, o, s) {
    this._file = t, this._packageFile = r, this.versionInfo = n, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: o,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, s && await (0, Pt.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, Pt.emptyDir)(this.cacheDirForPendingUpdate);
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
    if (!await (0, Pt.pathExists)(n))
      return null;
    let o;
    try {
      o = await (0, Pt.readJson)(n);
    } catch (f) {
      let c = "No cached update info available";
      return f.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), c += ` (error on read: ${f.message})`), r.info(c), null;
    }
    if (!((o == null ? void 0 : o.fileName) !== null))
      return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== o.sha512)
      return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${o.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const a = $r.join(this.cacheDirForPendingUpdate, o.fileName);
    if (!await (0, Pt.pathExists)(a))
      return r.info("Cached update file doesn't exist"), null;
    const l = await Yw(a);
    return t.info.sha512 !== l ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${l}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = o, a);
  }
  getUpdateInfoFile() {
    return $r.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
nn.DownloadedUpdateHelper = Ww;
function Yw(e, t = "sha512", r = "base64", n) {
  return new Promise((i, o) => {
    const s = (0, Gw.createHash)(t);
    s.on("error", o).setEncoding(r), (0, Vw.createReadStream)(e, {
      ...n,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", o).on("end", () => {
      s.end(), i(s.read());
    }).pipe(s, { end: !1 });
  });
}
async function zw(e, t, r) {
  let n = 0, i = $r.join(t, e);
  for (let o = 0; o < 3; o++)
    try {
      return await (0, Pt.unlink)(i), i;
    } catch (s) {
      if (s.code === "ENOENT")
        return i;
      r.warn(`Error on remove temp update file: ${s}`), i = $r.join(t, `${n++}-${e}`);
    }
  return i;
}
var pi = {}, Rs = {};
Object.defineProperty(Rs, "__esModule", { value: !0 });
Rs.getAppCacheDir = Kw;
const zi = Q, Xw = ot;
function Kw() {
  const e = (0, Xw.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || zi.join(e, "AppData", "Local") : process.platform === "darwin" ? t = zi.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || zi.join(e, ".cache"), t;
}
Object.defineProperty(pi, "__esModule", { value: !0 });
pi.ElectronAppAdapter = void 0;
const dl = Q, Jw = Rs;
class Qw {
  constructor(t = vt.app) {
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
    return this.isPackaged ? dl.join(process.resourcesPath, "app-update.yml") : dl.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, Jw.getAppCacheDir)();
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
pi.ElectronAppAdapter = Qw;
var If = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
  const t = Ee;
  e.NET_SESSION_NAME = "electron-updater";
  function r() {
    return vt.session.fromPartition(e.NET_SESSION_NAME, {
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
      const a = vt.net.request({
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
})(If);
var on = {}, Be = {}, Zw = "[object Symbol]", Rf = /[\\^$.*+?()[\]{}|]/g, e_ = RegExp(Rf.source), t_ = typeof Ce == "object" && Ce && Ce.Object === Object && Ce, r_ = typeof self == "object" && self && self.Object === Object && self, n_ = t_ || r_ || Function("return this")(), i_ = Object.prototype, o_ = i_.toString, hl = n_.Symbol, pl = hl ? hl.prototype : void 0, ml = pl ? pl.toString : void 0;
function s_(e) {
  if (typeof e == "string")
    return e;
  if (l_(e))
    return ml ? ml.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function a_(e) {
  return !!e && typeof e == "object";
}
function l_(e) {
  return typeof e == "symbol" || a_(e) && o_.call(e) == Zw;
}
function c_(e) {
  return e == null ? "" : s_(e);
}
function u_(e) {
  return e = c_(e), e && e_.test(e) ? e.replace(Rf, "\\$&") : e;
}
var f_ = u_;
Object.defineProperty(Be, "__esModule", { value: !0 });
Be.newBaseUrl = h_;
Be.newUrlFromBase = zo;
Be.getChannelFilename = p_;
Be.blockmapFiles = m_;
const $f = fr, d_ = f_;
function h_(e) {
  const t = new $f.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function zo(e, t, r = !1) {
  const n = new $f.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? n.search = i : r && (n.search = `noCache=${Date.now().toString(32)}`), n;
}
function p_(e) {
  return `${e}.yml`;
}
function m_(e, t, r) {
  const n = zo(`${e.pathname}.blockmap`, e);
  return [zo(`${e.pathname.replace(new RegExp(d_(r), "g"), t)}.blockmap`, e), n];
}
var he = {};
Object.defineProperty(he, "__esModule", { value: !0 });
he.Provider = void 0;
he.findFile = y_;
he.parseUpdateInfo = v_;
he.getFileList = Df;
he.resolveFiles = w_;
const St = Ee, g_ = _e, gl = Be;
class E_ {
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
    return this.requestHeaders == null ? r != null && (n.headers = r) : n.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, St.configureRequestUrl)(t, n), n;
  }
}
he.Provider = E_;
function y_(e, t, r) {
  if (e.length === 0)
    throw (0, St.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const n = e.find((i) => i.url.pathname.toLowerCase().endsWith(`.${t}`));
  return n ?? (r == null ? e[0] : e.find((i) => !r.some((o) => i.url.pathname.toLowerCase().endsWith(`.${o}`))));
}
function v_(e, t, r) {
  if (e == null)
    throw (0, St.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let n;
  try {
    n = (0, g_.load)(e);
  } catch (i) {
    throw (0, St.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return n;
}
function Df(e) {
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
  throw (0, St.newError)(`No files provided: ${(0, St.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function w_(e, t, r = (n) => n) {
  const i = Df(e).map((a) => {
    if (a.sha2 == null && a.sha512 == null)
      throw (0, St.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, St.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, gl.newUrlFromBase)(r(a.url), t),
      info: a
    };
  }), o = e.packages, s = o == null ? null : o[process.arch] || o.ia32;
  return s != null && (i[0].packageInfo = {
    ...s,
    path: (0, gl.newUrlFromBase)(r(s.path), t).href
  }), i;
}
Object.defineProperty(on, "__esModule", { value: !0 });
on.GenericProvider = void 0;
const El = Ee, Xi = Be, Ki = he;
class __ extends Ki.Provider {
  constructor(t, r, n) {
    super(n), this.configuration = t, this.updater = r, this.baseUrl = (0, Xi.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, Xi.getChannelFilename)(this.channel), r = (0, Xi.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let n = 0; ; n++)
      try {
        return (0, Ki.parseUpdateInfo)(await this.httpRequest(r), t, r);
      } catch (i) {
        if (i instanceof El.HttpError && i.statusCode === 404)
          throw (0, El.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
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
    return (0, Ki.resolveFiles)(t, this.baseUrl);
  }
}
on.GenericProvider = __;
var mi = {}, gi = {};
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.BitbucketProvider = void 0;
const yl = Ee, Ji = Be, Qi = he;
class T_ extends Qi.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r;
    const { owner: i, slug: o } = t;
    this.baseUrl = (0, Ji.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${o}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new yl.CancellationToken(), r = (0, Ji.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, Ji.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, void 0, t);
      return (0, Qi.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, yl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Qi.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: r } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${r}, channel: ${this.channel})`;
  }
}
gi.BitbucketProvider = T_;
var At = {};
Object.defineProperty(At, "__esModule", { value: !0 });
At.GitHubProvider = At.BaseGitHubProvider = void 0;
At.computeReleaseNotes = Ff;
const nt = Ee, tr = Nf, S_ = fr, rr = Be, Xo = he, Zi = /\/tag\/([^/]+)$/;
class Pf extends Xo.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, rr.newBaseUrl)((0, nt.githubUrl)(t, r));
    const i = r === "github.com" ? "api.github.com" : r;
    this.baseApiUrl = (0, rr.newBaseUrl)((0, nt.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const r = this.options.host;
    return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${t}` : t;
  }
}
At.BaseGitHubProvider = Pf;
class A_ extends Pf {
  constructor(t, r, n) {
    super(t, "github.com", n), this.options = t, this.updater = r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, r, n, i, o;
    const s = new nt.CancellationToken(), a = await this.httpRequest((0, rr.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, s), l = (0, nt.parseXml)(a);
    let f = l.element("entry", !1, "No published versions on GitHub"), c = null;
    try {
      if (this.updater.allowPrerelease) {
        const _ = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((r = tr.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
        if (_ === null)
          c = Zi.exec(f.element("link").attribute("href"))[1];
        else
          for (const S of l.getElements("entry")) {
            const A = Zi.exec(S.element("link").attribute("href"));
            if (A === null)
              continue;
            const D = A[1], L = ((n = tr.prerelease(D)) === null || n === void 0 ? void 0 : n[0]) || null, j = !_ || ["alpha", "beta"].includes(_), H = L !== null && !["alpha", "beta"].includes(String(L));
            if (j && !H && !(_ === "beta" && L === "alpha")) {
              c = D;
              break;
            }
            if (L && L === _) {
              c = D;
              break;
            }
          }
      } else {
        c = await this.getLatestTagName(s);
        for (const _ of l.getElements("entry"))
          if (Zi.exec(_.element("link").attribute("href"))[1] === c) {
            f = _;
            break;
          }
      }
    } catch (_) {
      throw (0, nt.newError)(`Cannot parse releases feed: ${_.stack || _.message},
XML:
${a}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (c == null)
      throw (0, nt.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let u, h = "", m = "";
    const w = async (_) => {
      h = (0, rr.getChannelFilename)(_), m = (0, rr.newUrlFromBase)(this.getBaseDownloadPath(String(c), h), this.baseUrl);
      const S = this.createRequestOptions(m);
      try {
        return await this.executor.request(S, s);
      } catch (A) {
        throw A instanceof nt.HttpError && A.statusCode === 404 ? (0, nt.newError)(`Cannot find ${h} in the latest release artifacts (${m}): ${A.stack || A.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : A;
      }
    };
    try {
      let _ = this.channel;
      this.updater.allowPrerelease && (!((i = tr.prerelease(c)) === null || i === void 0) && i[0]) && (_ = this.getCustomChannelName(String((o = tr.prerelease(c)) === null || o === void 0 ? void 0 : o[0]))), u = await w(_);
    } catch (_) {
      if (this.updater.allowPrerelease)
        u = await w(this.getDefaultChannelName());
      else
        throw _;
    }
    const y = (0, Xo.parseUpdateInfo)(u, h, m);
    return y.releaseName == null && (y.releaseName = f.elementValueOrEmpty("title")), y.releaseNotes == null && (y.releaseNotes = Ff(this.updater.currentVersion, this.updater.fullChangelog, l, f)), {
      tag: c,
      ...y
    };
  }
  async getLatestTagName(t) {
    const r = this.options, n = r.host == null || r.host === "github.com" ? (0, rr.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new S_.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const i = await this.httpRequest(n, { Accept: "application/json" }, t);
      return i == null ? null : JSON.parse(i).tag_name;
    } catch (i) {
      throw (0, nt.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, Xo.resolveFiles)(t, this.baseUrl, (r) => this.getBaseDownloadPath(t.tag, r.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, r) {
    return `${this.basePath}/download/${t}/${r}`;
  }
}
At.GitHubProvider = A_;
function vl(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function Ff(e, t, r, n) {
  if (!t)
    return vl(n);
  const i = [];
  for (const o of r.getElements("entry")) {
    const s = /\/tag\/v?([^/]+)$/.exec(o.element("link").attribute("href"))[1];
    tr.lt(e, s) && i.push({
      version: s,
      note: vl(o)
    });
  }
  return i.sort((o, s) => tr.rcompare(o.version, s.version));
}
var Ei = {};
Object.defineProperty(Ei, "__esModule", { value: !0 });
Ei.KeygenProvider = void 0;
const wl = Ee, eo = Be, to = he;
class b_ extends to.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, eo.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new wl.CancellationToken(), r = (0, eo.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, eo.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, to.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, wl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, to.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: r, platform: n } = this.configuration;
    return `Keygen (account: ${t}, product: ${r}, platform: ${n}, channel: ${this.channel})`;
  }
}
Ei.KeygenProvider = b_;
var yi = {};
Object.defineProperty(yi, "__esModule", { value: !0 });
yi.PrivateGitHubProvider = void 0;
const zt = Ee, O_ = _e, C_ = Q, _l = fr, Tl = Be, N_ = At, I_ = he;
class R_ extends N_.BaseGitHubProvider {
  constructor(t, r, n, i) {
    super(t, "api.github.com", i), this.updater = r, this.token = n;
  }
  createRequestOptions(t, r) {
    const n = super.createRequestOptions(t, r);
    return n.redirect = "manual", n;
  }
  async getLatestVersion() {
    const t = new zt.CancellationToken(), r = (0, Tl.getChannelFilename)(this.getDefaultChannelName()), n = await this.getLatestVersionInfo(t), i = n.assets.find((a) => a.name === r);
    if (i == null)
      throw (0, zt.newError)(`Cannot find ${r} in the release ${n.html_url || n.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const o = new _l.URL(i.url);
    let s;
    try {
      s = (0, O_.load)(await this.httpRequest(o, this.configureHeaders("application/octet-stream"), t));
    } catch (a) {
      throw a instanceof zt.HttpError && a.statusCode === 404 ? (0, zt.newError)(`Cannot find ${r} in the latest release artifacts (${o}): ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : a;
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
    const i = (0, Tl.newUrlFromBase)(n, this.baseUrl);
    try {
      const o = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      return r ? o.find((s) => s.prerelease) || o[0] : o;
    } catch (o) {
      throw (0, zt.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, I_.getFileList)(t).map((r) => {
      const n = C_.posix.basename(r.url).replace(/ /g, "-"), i = t.assets.find((o) => o != null && o.name === n);
      if (i == null)
        throw (0, zt.newError)(`Cannot find asset "${n}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new _l.URL(i.url),
        info: r
      };
    });
  }
}
yi.PrivateGitHubProvider = R_;
Object.defineProperty(mi, "__esModule", { value: !0 });
mi.isUrlProbablySupportMultiRangeRequests = Lf;
mi.createClient = L_;
const Rn = Ee, $_ = gi, Sl = on, D_ = At, P_ = Ei, F_ = yi;
function Lf(e) {
  return !e.includes("s3.amazonaws.com");
}
function L_(e, t, r) {
  if (typeof e == "string")
    throw (0, Rn.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const n = e.provider;
  switch (n) {
    case "github": {
      const i = e, o = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return o == null ? new D_.GitHubProvider(i, t, r) : new F_.PrivateGitHubProvider(i, t, o, r);
    }
    case "bitbucket":
      return new $_.BitbucketProvider(e, t, r);
    case "keygen":
      return new P_.KeygenProvider(e, t, r);
    case "s3":
    case "spaces":
      return new Sl.GenericProvider({
        provider: "generic",
        url: (0, Rn.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...r,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new Sl.GenericProvider(i, t, {
        ...r,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && Lf(i.url)
      });
    }
    case "custom": {
      const i = e, o = i.updateProvider;
      if (!o)
        throw (0, Rn.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new o(i, t, r);
    }
    default:
      throw (0, Rn.newError)(`Unsupported provider: ${n}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var vi = {}, sn = {}, mr = {}, Ht = {};
Object.defineProperty(Ht, "__esModule", { value: !0 });
Ht.OperationKind = void 0;
Ht.computeOperations = x_;
var xt;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(xt || (Ht.OperationKind = xt = {}));
function x_(e, t, r) {
  const n = bl(e.files), i = bl(t.files);
  let o = null;
  const s = t.files[0], a = [], l = s.name, f = n.get(l);
  if (f == null)
    throw new Error(`no file ${l} in old blockmap`);
  const c = i.get(l);
  let u = 0;
  const { checksumToOffset: h, checksumToOldSize: m } = k_(n.get(l), f.offset, r);
  let w = s.offset;
  for (let y = 0; y < c.checksums.length; w += c.sizes[y], y++) {
    const _ = c.sizes[y], S = c.checksums[y];
    let A = h.get(S);
    A != null && m.get(S) !== _ && (r.warn(`Checksum ("${S}") matches, but size differs (old: ${m.get(S)}, new: ${_})`), A = void 0), A === void 0 ? (u++, o != null && o.kind === xt.DOWNLOAD && o.end === w ? o.end += _ : (o = {
      kind: xt.DOWNLOAD,
      start: w,
      end: w + _
      // oldBlocks: null,
    }, Al(o, a, S, y))) : o != null && o.kind === xt.COPY && o.end === A ? o.end += _ : (o = {
      kind: xt.COPY,
      start: A,
      end: A + _
      // oldBlocks: [checksum]
    }, Al(o, a, S, y));
  }
  return u > 0 && r.info(`File${s.name === "file" ? "" : " " + s.name} has ${u} changed blocks`), a;
}
const U_ = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function Al(e, t, r, n) {
  if (U_ && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const o = [i.start, i.end, e.start, e.end].reduce((s, a) => s < a ? s : a);
      throw new Error(`operation (block index: ${n}, checksum: ${r}, kind: ${xt[e.kind]}) overlaps previous operation (checksum: ${r}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - o} until ${i.end - o} and ${e.start - o} until ${e.end - o}`);
    }
  }
  t.push(e);
}
function k_(e, t, r) {
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
function bl(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    t.set(r.name, r);
  return t;
}
Object.defineProperty(mr, "__esModule", { value: !0 });
mr.DataSplitter = void 0;
mr.copyData = xf;
const $n = Ee, M_ = Re, B_ = Xr, j_ = Ht, Ol = Buffer.from(`\r
\r
`);
var pt;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(pt || (pt = {}));
function xf(e, t, r, n, i) {
  const o = (0, M_.createReadStream)("", {
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
class H_ extends B_.Writable {
  constructor(t, r, n, i, o, s) {
    super(), this.out = t, this.options = r, this.partIndexToTaskIndex = n, this.partIndexToLength = o, this.finishHandler = s, this.partIndex = -1, this.headerListBuffer = null, this.readState = pt.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
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
      if (this.readState === pt.HEADER) {
        const n = this.searchHeaderListEnd(t, r);
        if (n === -1)
          return;
        r = n, this.readState = pt.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === pt.BODY)
          this.readState = pt.INIT;
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
            this.readState = pt.HEADER;
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
        if (s.kind !== j_.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        xf(s, this.out, this.options.oldFileFd, i, () => {
          t++, o();
        });
      };
      o();
    });
  }
  searchHeaderListEnd(t, r) {
    const n = t.indexOf(Ol, r);
    if (n !== -1)
      return n + Ol.length;
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
mr.DataSplitter = H_;
var wi = {};
Object.defineProperty(wi, "__esModule", { value: !0 });
wi.executeTasksUsingMultipleRangeRequests = q_;
wi.checkIsRangesSupported = Jo;
const Ko = Ee, Cl = mr, Nl = Ht;
function q_(e, t, r, n, i) {
  const o = (s) => {
    if (s >= t.length) {
      e.fileMetadataBuffer != null && r.write(e.fileMetadataBuffer), r.end();
      return;
    }
    const a = s + 1e3;
    G_(e, {
      tasks: t,
      start: s,
      end: Math.min(t.length, a),
      oldFileFd: n
    }, r, () => o(a), i);
  };
  return o;
}
function G_(e, t, r, n, i) {
  let o = "bytes=", s = 0;
  const a = /* @__PURE__ */ new Map(), l = [];
  for (let u = t.start; u < t.end; u++) {
    const h = t.tasks[u];
    h.kind === Nl.OperationKind.DOWNLOAD && (o += `${h.start}-${h.end - 1}, `, a.set(s, u), s++, l.push(h.end - h.start));
  }
  if (s <= 1) {
    const u = (h) => {
      if (h >= t.end) {
        n();
        return;
      }
      const m = t.tasks[h++];
      if (m.kind === Nl.OperationKind.COPY)
        (0, Cl.copyData)(m, r, t.oldFileFd, i, () => u(h));
      else {
        const w = e.createRequestOptions();
        w.headers.Range = `bytes=${m.start}-${m.end - 1}`;
        const y = e.httpExecutor.createRequest(w, (_) => {
          Jo(_, i) && (_.pipe(r, {
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
    if (!Jo(u, i))
      return;
    const h = (0, Ko.safeGetHeader)(u, "content-type"), m = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(h);
    if (m == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${h}"`));
      return;
    }
    const w = new Cl.DataSplitter(r, t, a, m[1] || m[2], l, n);
    w.on("error", i), u.pipe(w), u.on("end", () => {
      setTimeout(() => {
        c.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(c, i), c.end();
}
function Jo(e, t) {
  if (e.statusCode >= 400)
    return t((0, Ko.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const r = (0, Ko.safeGetHeader)(e, "accept-ranges");
    if (r == null || r === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var _i = {};
Object.defineProperty(_i, "__esModule", { value: !0 });
_i.ProgressDifferentialDownloadCallbackTransform = void 0;
const V_ = Xr;
var nr;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(nr || (nr = {}));
class W_ extends V_.Transform {
  constructor(t, r, n) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = nr.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == nr.COPY) {
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
    this.operationType = nr.COPY;
  }
  beginRangeDownload() {
    this.operationType = nr.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
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
_i.ProgressDifferentialDownloadCallbackTransform = W_;
Object.defineProperty(sn, "__esModule", { value: !0 });
sn.DifferentialDownloader = void 0;
const Ar = Ee, ro = bt, Y_ = Re, z_ = mr, X_ = fr, Dn = Ht, Il = wi, K_ = _i;
class J_ {
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
    return (0, Ar.configureRequestUrl)(this.options.newUrl, t), (0, Ar.configureRequestOptions)(t), t;
  }
  doDownload(t, r) {
    if (t.version !== r.version)
      throw new Error(`version is different (${t.version} - ${r.version}), full download is required`);
    const n = this.logger, i = (0, Dn.computeOperations)(t, r, n);
    n.debug != null && n.debug(JSON.stringify(i, null, 2));
    let o = 0, s = 0;
    for (const l of i) {
      const f = l.end - l.start;
      l.kind === Dn.OperationKind.DOWNLOAD ? o += f : s += f;
    }
    const a = this.blockAwareFileInfo.size;
    if (o + s + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== a)
      throw new Error(`Internal error, size mismatch: downloadSize: ${o}, copySize: ${s}, newSize: ${a}`);
    return n.info(`Full: ${Rl(a)}, To download: ${Rl(o)} (${Math.round(o / (a / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const r = [], n = () => Promise.all(r.map((i) => (0, ro.close)(i.descriptor).catch((o) => {
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
    const n = await (0, ro.open)(this.options.oldFile, "r");
    r.push({ descriptor: n, path: this.options.oldFile });
    const i = await (0, ro.open)(this.options.newFile, "w");
    r.push({ descriptor: i, path: this.options.newFile });
    const o = (0, Y_.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((s, a) => {
      const l = [];
      let f;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const S = [];
        let A = 0;
        for (const L of t)
          L.kind === Dn.OperationKind.DOWNLOAD && (S.push(L.end - L.start), A += L.end - L.start);
        const D = {
          expectedByteCounts: S,
          grandTotal: A
        };
        f = new K_.ProgressDifferentialDownloadCallbackTransform(D, this.options.cancellationToken, this.options.onProgress), l.push(f);
      }
      const c = new Ar.DigestTransform(this.blockAwareFileInfo.sha512);
      c.isValidateOnEnd = !1, l.push(c), o.on("finish", () => {
        o.close(() => {
          r.splice(1, 1);
          try {
            c.validate();
          } catch (S) {
            a(S);
            return;
          }
          s(void 0);
        });
      }), l.push(o);
      let u = null;
      for (const S of l)
        S.on("error", a), u == null ? u = S : u = u.pipe(S);
      const h = l[0];
      let m;
      if (this.options.isUseMultipleRangeRequest) {
        m = (0, Il.executeTasksUsingMultipleRangeRequests)(this, t, h, n, a), m(0);
        return;
      }
      let w = 0, y = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const _ = this.createRequestOptions();
      _.redirect = "manual", m = (S) => {
        var A, D;
        if (S >= t.length) {
          this.fileMetadataBuffer != null && h.write(this.fileMetadataBuffer), h.end();
          return;
        }
        const L = t[S++];
        if (L.kind === Dn.OperationKind.COPY) {
          f && f.beginFileCopy(), (0, z_.copyData)(L, h, n, a, () => m(S));
          return;
        }
        const j = `bytes=${L.start}-${L.end - 1}`;
        _.headers.range = j, (D = (A = this.logger) === null || A === void 0 ? void 0 : A.debug) === null || D === void 0 || D.call(A, `download range: ${j}`), f && f.beginRangeDownload();
        const H = this.httpExecutor.createRequest(_, (B) => {
          B.on("error", a), B.on("aborted", () => {
            a(new Error("response has been aborted by the server"));
          }), B.statusCode >= 400 && a((0, Ar.createHttpError)(B)), B.pipe(h, {
            end: !1
          }), B.once("end", () => {
            f && f.endRangeDownload(), ++w === 100 ? (w = 0, setTimeout(() => m(S), 1e3)) : m(S);
          });
        });
        H.on("redirect", (B, ce, E) => {
          this.logger.info(`Redirect to ${Q_(E)}`), y = E, (0, Ar.configureRequestUrl)(new X_.URL(y), _), H.followRedirect();
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
        (0, Il.checkIsRangesSupported)(s, i) && (s.on("error", i), s.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), s.on("data", r), s.on("end", () => n()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(o, i), o.end();
    });
  }
}
sn.DifferentialDownloader = J_;
function Rl(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function Q_(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(vi, "__esModule", { value: !0 });
vi.GenericDifferentialDownloader = void 0;
const Z_ = sn;
class eT extends Z_.DifferentialDownloader {
  download(t, r) {
    return this.doDownload(t, r);
  }
}
vi.GenericDifferentialDownloader = eT;
var Ot = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
  const t = Ee;
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
})(Ot);
Object.defineProperty(wt, "__esModule", { value: !0 });
wt.NoOpLogger = wt.AppUpdater = void 0;
const Oe = Ee, tT = ur, rT = ot, nT = Zn, Xt = bt, iT = _e, no = li, Dt = Q, Ft = Nf, $l = nn, oT = pi, Dl = If, sT = on, io = mi, aT = Nc, lT = Be, cT = vi, Kt = Ot;
class $s extends nT.EventEmitter {
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
        throw (0, Oe.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, Oe.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
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
    return (0, Dl.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new Uf();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new no.Lazy(() => this.loadUpdateConfig());
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
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new Kt.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (o) => this.checkIfUpdateSupported(o), this.clientPromise = null, this.stagingUserIdPromise = new no.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new no.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (o) => {
      this._logger.error(`Error: ${o.stack || o.message}`);
    }), r == null ? (this.app = new oT.ElectronAppAdapter(), this.httpExecutor = new Dl.ElectronHttpExecutor((o, s) => this.emit("login", o, s))) : (this.app = r, this.httpExecutor = null);
    const n = this.app.version, i = (0, Ft.parse)(n);
    if (i == null)
      throw (0, Oe.newError)(`App version is not a valid semver version: "${n}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = uT(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
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
    typeof t == "string" ? n = new sT.GenericProvider({ provider: "generic", url: t }, this, {
      ...r,
      isUseMultipleRangeRequest: (0, io.isUrlProbablySupportMultiRangeRequests)(t)
    }) : n = (0, io.createClient)(t, this, r), this.clientPromise = Promise.resolve(n);
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
      const n = $s.formatDownloadNotification(r.updateInfo.version, this.app.name, t);
      new vt.Notification(n).show();
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
    const i = await this.stagingUserIdPromise.value, s = Oe.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${n}, percentage: ${s}, user id: ${i}`), s < n;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const r = (0, Ft.parse)(t.version);
    if (r == null)
      throw (0, Oe.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const n = this.currentVersion;
    if ((0, Ft.eq)(r, n) || !await Promise.resolve(this.isUpdateSupported(t)) || !await this.isStagingMatch(t))
      return !1;
    const o = (0, Ft.gt)(r, n), s = (0, Ft.lt)(r, n);
    return o ? !0 : this.allowDowngrade && s;
  }
  checkIfUpdateSupported(t) {
    const r = t == null ? void 0 : t.minimumSystemVersion, n = (0, rT.release)();
    if (r)
      try {
        if ((0, Ft.lt)(n, r))
          return this._logger.info(`Current OS version ${n} is less than the minimum OS version required ${r} for version ${n}`), !1;
      } catch (i) {
        this._logger.warn(`Failed to compare current OS version(${n}) with minimum OS version(${r}): ${(i.message || i).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((n) => (0, io.createClient)(n, this, this.createProviderRuntimeOptions())));
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
    const n = new Oe.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: r,
      updateInfo: r,
      cancellationToken: n,
      downloadPromise: this.autoDownload ? this.downloadUpdate(n) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, Oe.asArray)(t.files).map((r) => r.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new Oe.CancellationToken()) {
    const r = this.updateInfoAndProvider;
    if (r == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, Oe.asArray)(r.info.files).map((i) => i.url).join(", ")}`);
    const n = (i) => {
      if (!(i instanceof Oe.CancellationError))
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
    this.emit(Kt.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, iT.load)(await (0, Xt.readFile)(this._appUpdateConfigPath, "utf-8"));
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
    const t = Dt.join(this.app.userDataPath, ".updaterId");
    try {
      const n = await (0, Xt.readFile)(t, "utf-8");
      if (Oe.UUID.check(n))
        return n;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${n}`);
    } catch (n) {
      n.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${n}`);
    }
    const r = Oe.UUID.v5((0, tT.randomBytes)(4096), Oe.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${r}`);
    try {
      await (0, Xt.outputFile)(t, r);
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
      const i = Dt.join(this.app.baseCachePath, r || this.app.name);
      n.debug != null && n.debug(`updater cache dir: ${i}`), t = new $l.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
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
    this.listenerCount(Kt.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (A) => this.emit(Kt.DOWNLOAD_PROGRESS, A));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, o = i.version, s = r.packageInfo;
    function a() {
      const A = decodeURIComponent(t.fileInfo.url.pathname);
      return A.endsWith(`.${t.fileExtension}`) ? Dt.basename(A) : t.fileInfo.info.url;
    }
    const l = await this.getOrCreateDownloadHelper(), f = l.cacheDirForPendingUpdate;
    await (0, Xt.mkdir)(f, { recursive: !0 });
    const c = a();
    let u = Dt.join(f, c);
    const h = s == null ? null : Dt.join(f, `package-${o}${Dt.extname(s.path) || ".7z"}`), m = async (A) => (await l.setDownloadedFile(u, h, i, r, c, A), await t.done({
      ...i,
      downloadedFile: u
    }), h == null ? [u] : [u, h]), w = this._logger, y = await l.validateDownloadedPath(u, i, r, w);
    if (y != null)
      return u = y, await m(!1);
    const _ = async () => (await l.clear().catch(() => {
    }), await (0, Xt.unlink)(u).catch(() => {
    })), S = await (0, $l.createTempUpdateFile)(`temp-${c}`, f, w);
    try {
      await t.task(S, n, h, _), await (0, Oe.retry)(() => (0, Xt.rename)(S, u), 60, 500, 0, 0, (A) => A instanceof Error && /^EBUSY:/.test(A.message));
    } catch (A) {
      throw await _(), A instanceof Oe.CancellationError && (w.info("cancelled"), this.emit("update-cancelled", i)), A;
    }
    return w.info(`New version ${o} has been downloaded to ${u}`), await m(!0);
  }
  async differentialDownloadInstaller(t, r, n, i, o) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const s = (0, lT.blockmapFiles)(t.url, this.app.version, r.updateInfoAndProvider.info.version);
      this._logger.info(`Download block maps (old: "${s[0]}", new: ${s[1]})`);
      const a = async (c) => {
        const u = await this.httpExecutor.downloadToBuffer(c, {
          headers: r.requestHeaders,
          cancellationToken: r.cancellationToken
        });
        if (u == null || u.length === 0)
          throw new Error(`Blockmap "${c.href}" is empty`);
        try {
          return JSON.parse((0, aT.gunzipSync)(u).toString());
        } catch (h) {
          throw new Error(`Cannot parse blockmap "${c.href}", error: ${h}`);
        }
      }, l = {
        newUrl: t.url,
        oldFile: Dt.join(this.downloadedUpdateHelper.cacheDir, o),
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: r.requestHeaders,
        cancellationToken: r.cancellationToken
      };
      this.listenerCount(Kt.DOWNLOAD_PROGRESS) > 0 && (l.onProgress = (c) => this.emit(Kt.DOWNLOAD_PROGRESS, c));
      const f = await Promise.all(s.map((c) => a(c)));
      return await new cT.GenericDifferentialDownloader(t.info, this.httpExecutor, l).download(f[0], f[1]), !1;
    } catch (s) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), this._testOnlyOptions != null)
        throw s;
      return !0;
    }
  }
}
wt.AppUpdater = $s;
function uT(e) {
  const t = (0, Ft.prerelease)(e);
  return t != null && t.length > 0;
}
class Uf {
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
wt.NoOpLogger = Uf;
Object.defineProperty(st, "__esModule", { value: !0 });
st.BaseUpdater = void 0;
const Pl = Kr, fT = wt;
class dT extends fT.AppUpdater {
  constructor(t, r) {
    super(t, r), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, r = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? r : this.autoRunAppAfterInstall) ? setImmediate(() => {
      vt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
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
    const i = (0, Pl.spawnSync)(t, r, {
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
        const a = { stdio: i, env: n, detached: !0 }, l = (0, Pl.spawn)(t, r, a);
        l.on("error", (f) => {
          s(f);
        }), l.unref(), l.pid !== void 0 && o(!0);
      } catch (a) {
        s(a);
      }
    });
  }
}
st.BaseUpdater = dT;
var Hr = {}, an = {};
Object.defineProperty(an, "__esModule", { value: !0 });
an.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const Jt = bt, hT = sn, pT = Nc;
class mT extends hT.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, r = t.size, n = r - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(n, r - 1);
    const i = kf(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await gT(this.options.oldFile), i);
  }
}
an.FileWithEmbeddedBlockMapDifferentialDownloader = mT;
function kf(e) {
  return JSON.parse((0, pT.inflateRawSync)(e).toString());
}
async function gT(e) {
  const t = await (0, Jt.open)(e, "r");
  try {
    const r = (await (0, Jt.fstat)(t)).size, n = Buffer.allocUnsafe(4);
    await (0, Jt.read)(t, n, 0, n.length, r - n.length);
    const i = Buffer.allocUnsafe(n.readUInt32BE(0));
    return await (0, Jt.read)(t, i, 0, i.length, r - n.length - i.length), await (0, Jt.close)(t), kf(i);
  } catch (r) {
    throw await (0, Jt.close)(t), r;
  }
}
Object.defineProperty(Hr, "__esModule", { value: !0 });
Hr.AppImageUpdater = void 0;
const Fl = Ee, Ll = Kr, ET = bt, yT = Re, br = Q, vT = st, wT = an, _T = he, xl = Ot;
class TT extends vT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, _T.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        const s = process.env.APPIMAGE;
        if (s == null)
          throw (0, Fl.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(n, s, i, r, t)) && await this.httpExecutor.download(n.url, i, o), await (0, ET.chmod)(i, 493);
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
      return this.listenerCount(xl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(xl.DOWNLOAD_PROGRESS, a)), await new wT.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, s).download(), !1;
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const r = process.env.APPIMAGE;
    if (r == null)
      throw (0, Fl.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, yT.unlinkSync)(r);
    let n;
    const i = br.basename(r), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    br.basename(o) === i || !/\d+\.\d+\.\d+/.test(i) ? n = r : n = br.join(br.dirname(r), br.basename(o)), (0, Ll.execFileSync)("mv", ["-f", o, n]), n !== r && this.emit("appimage-filename-updated", n);
    const s = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(n, [], s) : (s.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, Ll.execFileSync)(n, [], { env: s })), !0;
  }
}
Hr.AppImageUpdater = TT;
var qr = {};
Object.defineProperty(qr, "__esModule", { value: !0 });
qr.DebUpdater = void 0;
const ST = st, AT = he, Ul = Ot;
class bT extends ST.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, AT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Ul.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Ul.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
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
qr.DebUpdater = bT;
var Gr = {};
Object.defineProperty(Gr, "__esModule", { value: !0 });
Gr.PacmanUpdater = void 0;
const OT = st, kl = Ot, CT = he;
class NT extends OT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, CT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(kl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(kl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
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
Gr.PacmanUpdater = NT;
var Vr = {};
Object.defineProperty(Vr, "__esModule", { value: !0 });
Vr.RpmUpdater = void 0;
const IT = st, Ml = Ot, RT = he;
class $T extends IT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, RT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Ml.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Ml.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
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
Vr.RpmUpdater = $T;
var Wr = {};
Object.defineProperty(Wr, "__esModule", { value: !0 });
Wr.MacUpdater = void 0;
const Bl = Ee, oo = bt, DT = Re, jl = Q, PT = Ic, FT = wt, LT = he, Hl = Kr, ql = ur;
class xT extends FT.AppUpdater {
  constructor(t, r) {
    super(t, r), this.nativeUpdater = vt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (n) => {
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
      this.debug("Checking for macOS Rosetta environment"), o = (0, Hl.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), n.info(`Checked for macOS Rosetta environment (isRosetta=${o})`);
    } catch (u) {
      n.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${u}`);
    }
    let s = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const h = (0, Hl.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
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
    const l = (0, LT.findFile)(r, "zip", ["pkg", "dmg"]);
    if (l == null)
      throw (0, Bl.newError)(`ZIP file not provided: ${(0, Bl.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const f = t.updateInfoAndProvider.provider, c = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: l,
      downloadUpdateOptions: t,
      task: async (u, h) => {
        const m = jl.join(this.downloadedUpdateHelper.cacheDir, c), w = () => (0, oo.pathExistsSync)(m) ? !t.disableDifferentialDownload : (n.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let y = !0;
        w() && (y = await this.differentialDownloadInstaller(l, t, u, f, c)), y && await this.httpExecutor.download(l.url, u, h);
      },
      done: async (u) => {
        if (!t.disableDifferentialDownload)
          try {
            const h = jl.join(this.downloadedUpdateHelper.cacheDir, c);
            await (0, oo.copyFile)(u.downloadedFile, h);
          } catch (h) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${h.message}`);
          }
        return this.updateDownloaded(l, u);
      }
    });
  }
  async updateDownloaded(t, r) {
    var n;
    const i = r.downloadedFile, o = (n = t.info.size) !== null && n !== void 0 ? n : (await (0, oo.stat)(i)).size, s = this._logger, a = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${a})`), this.server = (0, PT.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${a})`), this.server.on("close", () => {
      s.info(`Proxy server for native Squirrel.Mac is closed (${a})`);
    });
    const l = (f) => {
      const c = f.address();
      return typeof c == "string" ? c : `http://127.0.0.1:${c == null ? void 0 : c.port}`;
    };
    return await new Promise((f, c) => {
      const u = (0, ql.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), h = Buffer.from(`autoupdater:${u}`, "ascii"), m = `/${(0, ql.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (w, y) => {
        const _ = w.url;
        if (s.info(`${_} requested`), _ === "/") {
          if (!w.headers.authorization || w.headers.authorization.indexOf("Basic ") === -1) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), s.warn("No authenthication info");
            return;
          }
          const D = w.headers.authorization.split(" ")[1], L = Buffer.from(D, "base64").toString("ascii"), [j, H] = L.split(":");
          if (j !== "autoupdater" || H !== u) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), s.warn("Invalid authenthication credentials");
            return;
          }
          const B = Buffer.from(`{ "url": "${l(this.server)}${m}" }`);
          y.writeHead(200, { "Content-Type": "application/json", "Content-Length": B.length }), y.end(B);
          return;
        }
        if (!_.startsWith(m)) {
          s.warn(`${_} requested, but not supported`), y.writeHead(404), y.end();
          return;
        }
        s.info(`${m} requested by Squirrel.Mac, pipe ${i}`);
        let S = !1;
        y.on("finish", () => {
          S || (this.nativeUpdater.removeListener("error", c), f([]));
        });
        const A = (0, DT.createReadStream)(i);
        A.on("error", (D) => {
          try {
            y.end();
          } catch (L) {
            s.warn(`cannot end response: ${L}`);
          }
          S = !0, this.nativeUpdater.removeListener("error", c), c(new Error(`Cannot pipe "${i}": ${D}`));
        }), y.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": o
        }), A.pipe(y);
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
Wr.MacUpdater = xT;
var Yr = {}, Ds = {};
Object.defineProperty(Ds, "__esModule", { value: !0 });
Ds.verifySignature = kT;
const Gl = Ee, Mf = Kr, UT = ot, Vl = Q;
function kT(e, t, r) {
  return new Promise((n, i) => {
    const o = t.replace(/'/g, "''");
    r.info(`Verifying signature ${o}`), (0, Mf.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${o}' | ConvertTo-Json -Compress"`], {
      shell: !0,
      timeout: 20 * 1e3
    }, (s, a, l) => {
      var f;
      try {
        if (s != null || l) {
          so(r, s, l, i), n(null);
          return;
        }
        const c = MT(a);
        if (c.Status === 0) {
          try {
            const w = Vl.normalize(c.Path), y = Vl.normalize(t);
            if (r.info(`LiteralPath: ${w}. Update Path: ${y}`), w !== y) {
              so(r, new Error(`LiteralPath of ${w} is different than ${y}`), l, i), n(null);
              return;
            }
          } catch (w) {
            r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(f = w.message) !== null && f !== void 0 ? f : w.stack}`);
          }
          const h = (0, Gl.parseDn)(c.SignerCertificate.Subject);
          let m = !1;
          for (const w of e) {
            const y = (0, Gl.parseDn)(w);
            if (y.size ? m = Array.from(y.keys()).every((S) => y.get(S) === h.get(S)) : w === h.get("CN") && (r.warn(`Signature validated using only CN ${w}. Please add your full Distinguished Name (DN) to publisherNames configuration`), m = !0), m) {
              n(null);
              return;
            }
          }
        }
        const u = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(c, (h, m) => h === "RawData" ? void 0 : m, 2);
        r.warn(`Sign verification failed, installer signed with incorrect certificate: ${u}`), n(u);
      } catch (c) {
        so(r, c, null, i), n(null);
        return;
      }
    });
  });
}
function MT(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const r = t.SignerCertificate;
  return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), t;
}
function so(e, t, r, n) {
  if (BT()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, Mf.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && n(t), r && n(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
}
function BT() {
  const e = UT.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(Yr, "__esModule", { value: !0 });
Yr.NsisUpdater = void 0;
const Pn = Ee, Wl = Q, jT = st, HT = an, Yl = Ot, qT = he, GT = bt, VT = Ds, zl = fr;
class WT extends jT.BaseUpdater {
  constructor(t, r) {
    super(t, r), this._verifyUpdateCodeSignature = (n, i) => (0, VT.verifySignature)(n, i, this._logger);
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
    const r = t.updateInfoAndProvider.provider, n = (0, qT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: n,
      task: async (i, o, s, a) => {
        const l = n.packageInfo, f = l != null && s != null;
        if (f && t.disableWebInstaller)
          throw (0, Pn.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !f && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (f || t.disableDifferentialDownload || await this.differentialDownloadInstaller(n, t, i, r, Pn.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(n.url, i, o);
        const c = await this.verifySignature(i);
        if (c != null)
          throw await a(), (0, Pn.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${c}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (f && await this.differentialDownloadWebPackage(t, l, s, r))
          try {
            await this.httpExecutor.download(new zl.URL(l.path), s, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: l.sha512
            });
          } catch (u) {
            try {
              await (0, GT.unlink)(s);
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
      this.spawnLog(Wl.join(process.resourcesPath, "elevate.exe"), [r].concat(n)).catch((s) => this.dispatchError(s));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), o(), !0) : (this.spawnLog(r, n).catch((s) => {
      const a = s.code;
      this._logger.info(`Cannot run installer: error code: ${a}, error message: "${s.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), a === "UNKNOWN" || a === "EACCES" ? o() : a === "ENOENT" ? vt.shell.openPath(r).catch((l) => this.dispatchError(l)) : this.dispatchError(s);
    }), !0);
  }
  async differentialDownloadWebPackage(t, r, n, i) {
    if (r.blockMapSize == null)
      return !0;
    try {
      const o = {
        newUrl: new zl.URL(r.path),
        oldFile: Wl.join(this.downloadedUpdateHelper.cacheDir, Pn.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: n,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(Yl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Yl.DOWNLOAD_PROGRESS, s)), await new HT.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, o).download();
    } catch (o) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), process.platform === "win32";
    }
    return !1;
  }
}
Yr.NsisUpdater = WT;
(function(e) {
  var t = Ce && Ce.__createBinding || (Object.create ? function(_, S, A, D) {
    D === void 0 && (D = A);
    var L = Object.getOwnPropertyDescriptor(S, A);
    (!L || ("get" in L ? !S.__esModule : L.writable || L.configurable)) && (L = { enumerable: !0, get: function() {
      return S[A];
    } }), Object.defineProperty(_, D, L);
  } : function(_, S, A, D) {
    D === void 0 && (D = A), _[D] = S[A];
  }), r = Ce && Ce.__exportStar || function(_, S) {
    for (var A in _) A !== "default" && !Object.prototype.hasOwnProperty.call(S, A) && t(S, _, A);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const n = bt, i = Q;
  var o = st;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return o.BaseUpdater;
  } });
  var s = wt;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return s.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return s.NoOpLogger;
  } });
  var a = he;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return a.Provider;
  } });
  var l = Hr;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return l.AppImageUpdater;
  } });
  var f = qr;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return f.DebUpdater;
  } });
  var c = Gr;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return c.PacmanUpdater;
  } });
  var u = Vr;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return u.RpmUpdater;
  } });
  var h = Wr;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return h.MacUpdater;
  } });
  var m = Yr;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return m.NsisUpdater;
  } }), r(Ot, e);
  let w;
  function y() {
    if (process.platform === "win32")
      w = new Yr.NsisUpdater();
    else if (process.platform === "darwin")
      w = new Wr.MacUpdater();
    else {
      w = new Hr.AppImageUpdater();
      try {
        const _ = i.join(process.resourcesPath, "package-type");
        if (!(0, n.existsSync)(_))
          return w;
        console.info("Checking for beta autoupdate feature for deb/rpm distributions");
        const S = (0, n.readFileSync)(_).toString().trim();
        switch (console.info("Found package-type:", S), S) {
          case "deb":
            w = new qr.DebUpdater();
            break;
          case "rpm":
            w = new Vr.RpmUpdater();
            break;
          case "pacman":
            w = new Gr.PacmanUpdater();
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
})(rt);
var kn = { exports: {} }, ao = { exports: {} }, Xl;
function Bf() {
  return Xl || (Xl = 1, function(e) {
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
  }(ao)), ao.exports;
}
var lo = { exports: {} }, co, Kl;
function YT() {
  if (Kl) return co;
  Kl = 1, co = e;
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
  return co;
}
var uo, Jl;
function zT() {
  if (Jl) return uo;
  Jl = 1;
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
  return uo = e, uo;
}
var fo, Ql;
function jf() {
  if (Ql) return fo;
  Ql = 1;
  const e = YT(), t = zT(), n = class n {
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
      W(this, "dependencies", {});
      W(this, "errorHandler", null);
      W(this, "eventLogger", null);
      W(this, "functions", {});
      W(this, "hooks", []);
      W(this, "isDev", !1);
      W(this, "levels", null);
      W(this, "logId", null);
      W(this, "scope", null);
      W(this, "transports", {});
      W(this, "variables", {});
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
  W(n, "instances", {});
  let r = n;
  return fo = r, fo;
}
var ho, Zl;
function XT() {
  if (Zl) return ho;
  Zl = 1;
  const e = console.error;
  class t {
    constructor({ logFn: n = null } = {}) {
      W(this, "logFn", null);
      W(this, "onError", null);
      W(this, "showDialog", !1);
      W(this, "preventDefault", !0);
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
  return ho = t, ho;
}
var po, ec;
function qt() {
  if (ec) return po;
  ec = 1, po = { transform: e };
  function e({
    logger: t,
    message: r,
    transport: n,
    initialData: i = (r == null ? void 0 : r.data) || [],
    transforms: o = n == null ? void 0 : n.transforms
  }) {
    return o.reduce((s, a) => typeof a == "function" ? a({ data: s, logger: t, message: r, transport: n }) : s, i);
  }
  return po;
}
var mo, tc;
function KT() {
  if (tc) return mo;
  tc = 1;
  const { transform: e } = qt();
  mo = r;
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
  return mo;
}
var go, rc;
function JT() {
  if (rc) return go;
  rc = 1;
  const { transform: e } = qt();
  go = r;
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
  return go;
}
var nc;
function QT() {
  return nc || (nc = 1, function(e) {
    const t = jf(), r = XT(), n = KT(), i = JT();
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
  }(lo)), lo.exports;
}
var Eo, ic;
function ZT() {
  if (ic) return Eo;
  ic = 1;
  const e = Re, t = Q;
  Eo = {
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
  return Eo;
}
var yo, oc;
function Hf() {
  if (oc) return yo;
  oc = 1;
  const e = Kr, t = ot, r = Q, n = ZT();
  class i {
    constructor() {
      W(this, "appName");
      W(this, "appPackageJson");
      W(this, "platform", process.platform);
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
  return yo = i, yo;
}
var vo, sc;
function eS() {
  if (sc) return vo;
  sc = 1;
  const e = Q, t = Hf();
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
      W(this, "electron");
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
  return vo = r, vo;
}
var wo, ac;
function tS() {
  if (ac) return wo;
  ac = 1;
  const e = Re, t = ot, r = Q, n = Bf();
  wo = {
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
  return wo;
}
var _o, lc;
function rS() {
  if (lc) return _o;
  lc = 1;
  class e {
    constructor({
      externalApi: n,
      logFn: i = void 0,
      onError: o = void 0,
      showDialog: s = void 0
    } = {}) {
      W(this, "externalApi");
      W(this, "isActive", !1);
      W(this, "logFn");
      W(this, "onError");
      W(this, "showDialog", !0);
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
  return _o = e, _o;
}
var To, cc;
function nS() {
  if (cc) return To;
  cc = 1;
  class e {
    constructor(r = {}) {
      W(this, "disposers", []);
      W(this, "format", "{eventSource}#{eventName}:");
      W(this, "formatters", {
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
      W(this, "events", {
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
      W(this, "externalApi");
      W(this, "level", "error");
      W(this, "scope", "");
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
  return To = e, To;
}
var So, uc;
function qf() {
  if (uc) return So;
  uc = 1;
  const { transform: e } = qt();
  So = {
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
  return So;
}
var Ao = { exports: {} }, fc;
function Ti() {
  return fc || (fc = 1, function(e) {
    const t = Qn;
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
  }(Ao)), Ao.exports;
}
var bo, dc;
function Ps() {
  if (dc) return bo;
  dc = 1, bo = {
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
  return bo;
}
var Oo, hc;
function iS() {
  if (hc) return Oo;
  hc = 1;
  const {
    concatFirstStringElements: e,
    format: t
  } = qf(), { maxDepth: r, toJSON: n } = Ti(), {
    applyAnsiStyles: i,
    removeStyles: o
  } = Ps(), { transform: s } = qt(), a = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  Oo = c;
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
      writeFn({ message: S }) {
        (a[S.level] || a.info)(...S.data);
      }
    });
    function _(S) {
      const A = s({ logger: y, message: S, transport: _ });
      _.writeFn({
        message: { ...S, data: A }
      });
    }
  }
  function u({ data: y, message: _, transport: S }) {
    return typeof S.format != "string" || !S.format.includes("%c") ? y : [`color:${w(_.level)}`, "color:unset", ...y];
  }
  function h(y, _) {
    if (typeof y == "boolean")
      return y;
    const A = _ === "error" || _ === "warn" ? process.stderr : process.stdout;
    return A && A.isTTY;
  }
  function m(y) {
    const { message: _, transport: S } = y;
    return (h(S.useStyles, _.level) ? i : o)(y);
  }
  function w(y) {
    const _ = { error: "red", warn: "yellow", info: "cyan", default: "unset" };
    return _[y] || _.default;
  }
  return Oo;
}
var Co, pc;
function Gf() {
  if (pc) return Co;
  pc = 1;
  const e = Zn, t = Re, r = ot;
  class n extends e {
    constructor({
      path: a,
      writeOptions: l = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync: f = !1
    }) {
      super();
      W(this, "asyncWriteQueue", []);
      W(this, "bytesWritten", 0);
      W(this, "hasActiveAsyncWriting", !1);
      W(this, "path", null);
      W(this, "initialSize");
      W(this, "writeOptions", null);
      W(this, "writeAsync", !1);
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
  Co = n;
  function i(o, s) {
    const a = Buffer.alloc(s), l = t.statSync(o), f = Math.min(l.size, s), c = Math.max(0, l.size - s), u = t.openSync(o, "r"), h = t.readSync(u, a, 0, f, c);
    return t.closeSync(u), a.toString("utf8", 0, h);
  }
  return Co;
}
var No, mc;
function oS() {
  if (mc) return No;
  mc = 1;
  const e = Gf();
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
  return No = t, No;
}
var Io, gc;
function sS() {
  if (gc) return Io;
  gc = 1;
  const e = Zn, t = Re, r = Q, n = Gf(), i = oS();
  class o extends e {
    constructor() {
      super();
      W(this, "store", {});
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
  return Io = o, Io;
}
var Ro, Ec;
function aS() {
  if (Ec) return Ro;
  Ec = 1;
  const e = Re, t = ot, r = Q, n = sS(), { transform: i } = qt(), { removeStyles: o } = Ps(), {
    format: s,
    concatFirstStringElements: a
  } = qf(), { toString: l } = Ti();
  Ro = c;
  const f = new n();
  function c(h, { registry: m = f, externalApi: w } = {}) {
    let y;
    return m.listenerCount("error") < 1 && m.on("error", (j, H) => {
      A(`Can't write to ${H}`, j);
    }), Object.assign(_, {
      fileName: u(h.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: D,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: L,
      sync: !0,
      transforms: [o, s, a, l],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(j) {
        const H = j.toString(), B = r.parse(H);
        try {
          e.renameSync(H, r.join(B.dir, `${B.name}.old${B.ext}`));
        } catch (ce) {
          A("Could not rotate log", ce);
          const E = Math.round(_.maxSize / 4);
          j.crop(Math.min(E, 256 * 1024));
        }
      },
      resolvePathFn(j) {
        return r.join(j.libraryDefaultDir, j.fileName);
      },
      setAppName(j) {
        h.dependencies.externalApi.setAppName(j);
      }
    });
    function _(j) {
      const H = D(j);
      _.maxSize > 0 && H.size > _.maxSize && (_.archiveLogFn(H), H.reset());
      const ce = i({ logger: h, message: j, transport: _ });
      H.writeLine(ce);
    }
    function S() {
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
      ), typeof _.archiveLog == "function" && (_.archiveLogFn = _.archiveLog, A("archiveLog is deprecated. Use archiveLogFn instead")), typeof _.resolvePath == "function" && (_.resolvePathFn = _.resolvePath, A("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function A(j, H = null, B = "error") {
      const ce = [`electron-log.transports.file: ${j}`];
      H && ce.push(H), h.transports.console({ data: ce, date: /* @__PURE__ */ new Date(), level: B });
    }
    function D(j) {
      S();
      const H = _.resolvePathFn(y, j);
      return m.provide({
        filePath: H,
        writeAsync: !_.sync,
        writeOptions: _.writeOptions
      });
    }
    function L({ fileFilter: j = (H) => H.endsWith(".log") } = {}) {
      S();
      const H = r.dirname(_.resolvePathFn(y));
      return e.existsSync(H) ? e.readdirSync(H).map((B) => r.join(H, B)).filter(j).map((B) => {
        try {
          return {
            path: B,
            lines: e.readFileSync(B, "utf8").split(t.EOL)
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
  return Ro;
}
var $o, yc;
function lS() {
  if (yc) return $o;
  yc = 1;
  const { maxDepth: e, toJSON: t } = Ti(), { transform: r } = qt();
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
var Do, vc;
function cS() {
  if (vc) return Do;
  vc = 1;
  const e = Ic, t = ih, { transform: r } = qt(), { removeStyles: n } = Ps(), { toJSON: i, maxDepth: o } = Ti();
  Do = s;
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
  return Do;
}
var Po, wc;
function Vf() {
  if (wc) return Po;
  wc = 1;
  const e = jf(), t = rS(), r = nS(), n = iS(), i = aS(), o = lS(), s = cS();
  Po = a;
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
  return Po;
}
var Fo, _c;
function uS() {
  if (_c) return Fo;
  _c = 1;
  const e = vt, t = eS(), { initialize: r } = tS(), n = Vf(), i = new t({ electron: e }), o = n({
    dependencies: { externalApi: i },
    initializeFn: r
  });
  Fo = o, i.onIpc("__ELECTRON_LOG__", (a, l) => {
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
  return Fo;
}
var Lo, Tc;
function fS() {
  if (Tc) return Lo;
  Tc = 1;
  const e = Hf(), t = Vf(), r = new e();
  return Lo = t({
    dependencies: { externalApi: r }
  }), Lo;
}
const dS = typeof process > "u" || process.type === "renderer" || process.type === "worker", hS = typeof process == "object" && process.type === "browser";
dS ? (Bf(), kn.exports = QT()) : hS ? kn.exports = uS() : kn.exports = fS();
var pS = kn.exports;
const qe = /* @__PURE__ */ $c(pS), mS = () => K.prepare("SELECT * FROM courts ORDER BY name ASC").all(), gS = () => K.prepare("SELECT * FROM tags ORDER BY name ASC").all(), ES = (e) => {
  K.prepare(`
    UPDATE courts SET is_synced = 1 WHERE id = ?
  `).run(e);
}, yS = (e) => {
  K.prepare(`
    UPDATE tags SET is_synced = 1 WHERE id = ?
  `).run(e);
}, vS = () => K.prepare(`
      SELECT * FROM courts WHERE is_synced = 0
    `).all(), wS = () => K.prepare(`
      SELECT * FROM tags WHERE is_synced = 0
    `).all(), _S = (e, t, r) => {
  const n = K.prepare(`
    INSERT INTO courts (id, name, created_at, is_synced)
    VALUES (@id, @name, @created_at, @is_synced)
    ON CONFLICT(name) DO NOTHING
  `), i = {
    id: t || Rc(),
    name: e,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: r || 0
  };
  return n.run(i).changes > 0;
}, TS = (e, t, r) => {
  const n = K.prepare(`
    INSERT INTO tags (id, name, created_at, is_synced)
    VALUES (@id, @name, @created_at, @is_synced)
    ON CONFLICT(name) DO NOTHING
  `), i = {
    id: t || Rc(),
    name: e,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: r || 0
  };
  return n.run(i).changes > 0;
};
async function SS(e) {
  console.log(process.env.VITE_SUPABASE_URL);
  const t = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users/${e}`, {
    method: "DELETE",
    headers: {
      apiKey: process.env.VITE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.VITE_SERVICE_ROLE_KEY}`
    }
  });
  return t.status === 200 || t.status === 404 ? { success: !0 } : { success: !1, error: `Failed: ${await t.text()}` };
}
var at = { exports: {} };
const AS = "16.5.0", bS = {
  version: AS
}, Qo = Re, Fs = Q, OS = ot, CS = ur, NS = bS, Wf = NS.version, IS = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function RS(e) {
  const t = {};
  let r = e.toString();
  r = r.replace(/\r\n?/mg, `
`);
  let n;
  for (; (n = IS.exec(r)) != null; ) {
    const i = n[1];
    let o = n[2] || "";
    o = o.trim();
    const s = o[0];
    o = o.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), s === '"' && (o = o.replace(/\\n/g, `
`), o = o.replace(/\\r/g, "\r")), t[i] = o;
  }
  return t;
}
function $S(e) {
  const t = zf(e), r = de.configDotenv({ path: t });
  if (!r.parsed) {
    const s = new Error(`MISSING_DATA: Cannot parse ${t} for an unknown reason`);
    throw s.code = "MISSING_DATA", s;
  }
  const n = Yf(e).split(","), i = n.length;
  let o;
  for (let s = 0; s < i; s++)
    try {
      const a = n[s].trim(), l = PS(r, a);
      o = de.decrypt(l.ciphertext, l.key);
      break;
    } catch (a) {
      if (s + 1 >= i)
        throw a;
    }
  return de.parse(o);
}
function DS(e) {
  console.log(`[dotenv@${Wf}][WARN] ${e}`);
}
function zr(e) {
  console.log(`[dotenv@${Wf}][DEBUG] ${e}`);
}
function Yf(e) {
  return e && e.DOTENV_KEY && e.DOTENV_KEY.length > 0 ? e.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
}
function PS(e, t) {
  let r;
  try {
    r = new URL(t);
  } catch (a) {
    if (a.code === "ERR_INVALID_URL") {
      const l = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      throw l.code = "INVALID_DOTENV_KEY", l;
    }
    throw a;
  }
  const n = r.password;
  if (!n) {
    const a = new Error("INVALID_DOTENV_KEY: Missing key part");
    throw a.code = "INVALID_DOTENV_KEY", a;
  }
  const i = r.searchParams.get("environment");
  if (!i) {
    const a = new Error("INVALID_DOTENV_KEY: Missing environment part");
    throw a.code = "INVALID_DOTENV_KEY", a;
  }
  const o = `DOTENV_VAULT_${i.toUpperCase()}`, s = e.parsed[o];
  if (!s) {
    const a = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${o} in your .env.vault file.`);
    throw a.code = "NOT_FOUND_DOTENV_ENVIRONMENT", a;
  }
  return { ciphertext: s, key: n };
}
function zf(e) {
  let t = null;
  if (e && e.path && e.path.length > 0)
    if (Array.isArray(e.path))
      for (const r of e.path)
        Qo.existsSync(r) && (t = r.endsWith(".vault") ? r : `${r}.vault`);
    else
      t = e.path.endsWith(".vault") ? e.path : `${e.path}.vault`;
  else
    t = Fs.resolve(process.cwd(), ".env.vault");
  return Qo.existsSync(t) ? t : null;
}
function Sc(e) {
  return e[0] === "~" ? Fs.join(OS.homedir(), e.slice(1)) : e;
}
function FS(e) {
  !!(e && e.debug) && zr("Loading env from encrypted .env.vault");
  const r = de._parseVault(e);
  let n = process.env;
  return e && e.processEnv != null && (n = e.processEnv), de.populate(n, r, e), { parsed: r };
}
function LS(e) {
  const t = Fs.resolve(process.cwd(), ".env");
  let r = "utf8";
  const n = !!(e && e.debug);
  e && e.encoding ? r = e.encoding : n && zr("No encoding is specified. UTF-8 is used by default");
  let i = [t];
  if (e && e.path)
    if (!Array.isArray(e.path))
      i = [Sc(e.path)];
    else {
      i = [];
      for (const l of e.path)
        i.push(Sc(l));
    }
  let o;
  const s = {};
  for (const l of i)
    try {
      const f = de.parse(Qo.readFileSync(l, { encoding: r }));
      de.populate(s, f, e);
    } catch (f) {
      n && zr(`Failed to load ${l} ${f.message}`), o = f;
    }
  let a = process.env;
  return e && e.processEnv != null && (a = e.processEnv), de.populate(a, s, e), o ? { parsed: s, error: o } : { parsed: s };
}
function xS(e) {
  if (Yf(e).length === 0)
    return de.configDotenv(e);
  const t = zf(e);
  return t ? de._configVault(e) : (DS(`You set DOTENV_KEY but you are missing a .env.vault file at ${t}. Did you forget to build it?`), de.configDotenv(e));
}
function US(e, t) {
  const r = Buffer.from(t.slice(-64), "hex");
  let n = Buffer.from(e, "base64");
  const i = n.subarray(0, 12), o = n.subarray(-16);
  n = n.subarray(12, -16);
  try {
    const s = CS.createDecipheriv("aes-256-gcm", r, i);
    return s.setAuthTag(o), `${s.update(n)}${s.final()}`;
  } catch (s) {
    const a = s instanceof RangeError, l = s.message === "Invalid key length", f = s.message === "Unsupported state or unable to authenticate data";
    if (a || l) {
      const c = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      throw c.code = "INVALID_DOTENV_KEY", c;
    } else if (f) {
      const c = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      throw c.code = "DECRYPTION_FAILED", c;
    } else
      throw s;
  }
}
function kS(e, t, r = {}) {
  const n = !!(r && r.debug), i = !!(r && r.override);
  if (typeof t != "object") {
    const o = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw o.code = "OBJECT_REQUIRED", o;
  }
  for (const o of Object.keys(t))
    Object.prototype.hasOwnProperty.call(e, o) ? (i === !0 && (e[o] = t[o]), n && zr(i === !0 ? `"${o}" is already defined and WAS overwritten` : `"${o}" is already defined and was NOT overwritten`)) : e[o] = t[o];
}
const de = {
  configDotenv: LS,
  _configVault: FS,
  _parseVault: $S,
  config: xS,
  decrypt: US,
  parse: RS,
  populate: kS
};
at.exports.configDotenv = de.configDotenv;
at.exports._configVault = de._configVault;
at.exports._parseVault = de._parseVault;
at.exports.config = de.config;
at.exports.decrypt = de.decrypt;
at.exports.parse = de.parse;
at.exports.populate = de.populate;
at.exports = de;
var MS = at.exports;
const BS = /* @__PURE__ */ $c(MS);
BS.config();
bc(import.meta.url);
const jS = th(import.meta.url), Zo = Je.dirname(jS);
process.env.APP_ROOT = Je.join(Zo, "..");
const Mn = process.env.VITE_DEV_SERVER_URL, uA = Je.join(process.env.APP_ROOT, "dist-electron"), es = Je.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Mn ? Je.join(process.env.APP_ROOT, "public") : es;
let ht;
function Xf() {
  ht = new Ac({
    icon: Je.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: Je.join(Zo, "preload.mjs")
    }
  }), console.log(Je.join(Zo, "preload.mjs")), ht.webContents.on("did-finish-load", () => {
    ht == null || ht.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Mn ? (ht.loadURL(Mn), console.log("VITE_DEV_SERVER_URL: ", Mn)) : (ht.loadFile(Je.join(es, "index.html")), console.log("RENDERER_DIST: ", Je.join(es, "index.html")));
}
Dr.on("window-all-closed", () => {
  process.platform !== "darwin" && (Dr.quit(), ht = null);
});
Dr.on("activate", () => {
  Ac.getAllWindows().length === 0 && Xf();
});
Dr.whenReady().then(() => {
  Xf(), rt.autoUpdater.logger = qe, qe.info("App starting..."), rt.autoUpdater.checkForUpdates(), rt.autoUpdater.on("checking-for-update", () => {
    qe.info("Checking for update...");
  }), rt.autoUpdater.on("update-available", (e) => {
    qe.info("Update available.", e);
  }), rt.autoUpdater.on("update-not-available", (e) => {
    qe.info("Update not available.", e);
  }), rt.autoUpdater.on("error", (e) => {
    qe.error("Error in auto-updater:", e);
  }), rt.autoUpdater.on("download-progress", (e) => {
    qe.info(`Download speed: ${e.bytesPerSecond}`), qe.info(`Downloaded ${e.percent}%`), qe.info(`${e.transferred}/${e.total}`);
  }), rt.autoUpdater.on("update-downloaded", (e) => {
    qe.info("Update downloaded. Will install on quit."), qe.info(e.version);
  }), Z.on("log", (e, ...t) => {
    console.log("\x1B[32m%s\x1B[0m", "[Renderer Log]:", ...t);
  }), Z.handle("open-file", async (e, t) => await eh.openPath(t)), Z.handle("database:insert-client", (e, t) => ah(t)), Z.handle("database:get-all-clients", () => lh()), Z.handle("database:update-client-field", (e, t, r, n) => ch(t, r, n)), Z.handle("database:delete-client", (e, t) => uh(t)), Z.handle("database:insert-case", (e, t) => ph(t)), Z.handle("database:get-all-cases", () => mh()), Z.handle("database:delete-case", (e, t) => Eh(t)), Z.handle("database:update-case", (e, t, r, n) => gh(t, r, n)), Z.handle("database:insert-task", (e, t) => _h(t)), Z.handle("database:get-all-tasks", () => Th()), Z.handle("database:delete-task", (e, t) => Sh(t)), Z.handle("database:update-task", (e, t) => Ah(t)), Z.handle("get-courts", () => mS()), Z.handle("get-tags", () => gS()), Z.handle("insert-court", (e, t, r, n) => _S(t, r, n)), Z.handle("insert-tag", (e, t, r, n) => TS(t, r, n)), Z.handle("update-court-sync", (e, t) => ES(t)), Z.handle("update-tag-sync", (e, t) => yS(t)), Z.handle("unsynced-courts", () => vS()), Z.handle("unsynced-tags", () => wS()), Z.handle("unsynced-clients", () => fh()), Z.handle("update-client-sync", (e, t) => dh(t)), Z.handle("insert-or-update-clients", (e, t) => hh(t)), Z.handle("unsynced-cases", () => yh()), Z.handle("update-case-sync", (e, t) => vh(t)), Z.handle("insert-or-update-cases", (e, t) => wh(t)), Z.handle("admin:delete-user", async (e, t) => {
    const r = await SS(t);
    return console.log(r), r;
  });
});
export {
  uA as MAIN_DIST,
  es as RENDERER_DIST,
  Mn as VITE_DEV_SERVER_URL
};
