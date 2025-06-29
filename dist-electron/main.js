var nh = Object.defineProperty;
var ih = (e, t, r) => t in e ? nh(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var W = (e, t, r) => ih(e, typeof t != "symbol" ? t + "" : t, r);
import yt, { app as vt, BrowserWindow as to, ipcMain as K, shell as sh } from "electron";
import { createRequire as ro } from "node:module";
import Z from "path";
import $e from "fs";
import { fileURLToPath as oh } from "node:url";
import je from "node:path";
import ah from "constants";
import Xr from "stream";
import Zn from "util";
import Rc from "assert";
import Kr from "child_process";
import ei from "events";
import fr from "crypto";
import Ic from "tty";
import st from "os";
import dr from "url";
import lh from "string_decoder";
import Nc from "zlib";
import $c from "http";
import ch from "https";
import { randomUUID as Dc } from "node:crypto";
import { Buffer as uh } from "buffer";
const fh = ro(import.meta.url), dh = fh("better-sqlite3");
console.log("App Name:", vt.getName());
const hh = vt.getPath("userData"), no = Z.join(hh, "lawfirm.db");
console.log("Database Path:", no);
$e.mkdirSync(Z.dirname(no), { recursive: !0 });
const X = new dh(no);
X.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cases (
    file_id TEXT PRIMARY KEY,
    case_id TEXT,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
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
    note TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending', 'Deffered')) NOT NULL DEFAULT 'Open',
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) NOT NULL DEFAULT 'Medium',
    dueDate TEXT,
    caseId TEXT,
    client_id TEXT,
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

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    user_name TEXT DEFAULT '',
    action_type TEXT DEFAULT '',
    object_type TEXT DEFAULT '',
    object_id TEXT DEFAULT '',
    is_synced INTEGER DEFAULT 0
  );
`);
const ph = (e) => {
  if (X.prepare("SELECT 1 FROM clients WHERE phone = ? ").get(e.phone))
    return { success: !1, error: "Client with same phone already exists." };
  const r = X.prepare(`
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
}, mh = () => X.prepare("SELECT * FROM clients").all(), gh = (e, t, r) => {
  if (!["name", "email", "phone", "address", "note"].includes(t)) return !1;
  const i = (/* @__PURE__ */ new Date()).toISOString();
  return X.prepare(
    `UPDATE clients SET ${t} = ?, 
    is_synced = 0,
    updated_at = ?
    WHERE id = ?`
  ).run(r, i, e).changes === 0 ? { success: !1, error: "Update Failed: No idea what happend." } : { success: !0 };
}, Eh = (e) => {
  const t = X.prepare("DELETE FROM clients WHERE id = ?").run(e);
  return console.log("Delete results: ", t), t.changes > 0 ? { success: !0 } : { success: !1, error: "Delete Failed: Client not found." };
}, yh = () => X.prepare(`
    SELECT * FROM clients WHERE is_synced = 0
  `).all(), vh = (e) => X.prepare(`
    UPDATE clients SET is_synced = 1 WHERE id = ?
  `).run(e), _h = (e) => {
  const t = X.prepare(`
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
  X.transaction(() => {
    for (const n of e) t.run(n);
  })();
}, wh = (e) => {
  if (X.prepare("SELECT 1 FROM cases WHERE file_id = ?").get(e.file_id))
    return { success: !1, error: "Case with same File ID already exists." };
  const r = X.prepare(`
    INSERT INTO cases
    (file_id, case_id, title, description, status, client_id, court, created_at, tags, updated_at, is_synced)
    VALUES (@file_id, @case_id, @title, @description, @status, @client_id, @court, @created_at, @tags, @updated_at, @is_synced)
  `), n = {
    ...e,
    tags: JSON.stringify(e.tags ?? []),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: 0
  };
  return r.run(n).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0, data: { ...n, tags: e.tags ?? [] } };
}, Th = () => X.prepare("SELECT * FROM cases").all(), Sh = (e, t, r) => {
  if (!X.prepare("SELECT 1 FROM cases WHERE file_id = ?").get(e)) return { success: !1, error: "Case not found" };
  const i = t === "tags", s = (/* @__PURE__ */ new Date()).toISOString();
  if (!X.prepare(`
    UPDATE cases
    SET ${t} = ?, updated_at = ?, is_synced = 0
    WHERE file_id = ?
  `).run(
    i ? JSON.stringify(r) : r,
    s,
    e
  ).changes) return { success: !1, error: "Update failed: No idea what happend." };
  const l = t === "file_id" ? r : e, f = X.prepare("SELECT * FROM cases WHERE file_id = ?").get(l);
  return { success: !0, updatedCase: ((u) => ({
    ...u,
    tags: u.tags ? JSON.parse(u.tags) : []
  }))(f) };
}, Ah = (e) => X.prepare("DELETE FROM cases WHERE file_id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, bh = () => X.prepare(`
    SELECT * FROM cases WHERE is_synced = 0
  `).all(), Oh = (e) => X.prepare(`
    UPDATE cases SET is_synced = 1 WHERE file_id = ?
  `).run(e), Ch = (e) => {
  const t = X.prepare(`
    INSERT INTO cases (file_id, case_id, title, description, status, client_id, court, tags, created_at, updated_at, is_synced)
    VALUES (@file_id, @case_id, @title, @description, @status, @client_id, @court, @tags, @created_at, @updated_at, 1)
    ON CONFLICT(file_id) DO UPDATE SET
      case_id = excluded.case_id,
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
  X.transaction(() => {
    for (const n of e) t.run({
      ...n,
      client_id: n.client_id,
      tags: n.tags ?? ""
      // store tags as JSON string
    });
  })();
}, Rh = (e) => {
  const t = X.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, dueDate, client_id, caseId, status, priority, note, updated_at, created_at, is_synced)
    VALUES (@id, @title, @dueDate, @client_id, @caseId, @status, @priority, @note, @updated_at, @created_at, @is_synced)
  `), r = (/* @__PURE__ */ new Date()).toISOString();
  return t.run({
    ...e,
    note: e.note ?? "",
    updated_at: r,
    created_at: r,
    is_synced: 0
  }).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : { success: !0 };
}, Ih = () => X.prepare("SELECT * FROM tasks").all(), Nh = (e) => X.prepare("DELETE FROM tasks WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Delete Failed: No idea what happend." } : { success: !0 }, $h = (e) => {
  const r = X.prepare(`
    UPDATE tasks
    SET 
      title = @title,
      note = @note,
      status = @status,
      priority = @priority,
      dueDate = @dueDate,
      caseId = @caseId,
      client_id = @client_id,
      updated_at = @updated_at,
      is_synced = @is_synced
    WHERE id = @id
  `).run({
    ...e,
    note: e.note ?? "",
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: 0
  });
  return console.log(r), r.changes === 0 ? { success: !1, error: "Update failed: No such task found (or i have no idea what happend)." } : { success: !0 };
}, Dh = (e) => X.prepare(`
    INSERT INTO audits (id, created_at, user_id, user_name, action_type, object_type, object_id, is_synced)
    VALUES (@id, @created_at, @user_id, @user_name, @action_type, @object_type, @object_id, @is_synced)
  `).run(e).changes === 0 ? { success: !1, error: "Insert failed: no rows affected." } : (X.prepare(`
    DELETE FROM audits
    WHERE id IN (
      SELECT id FROM audits
      ORDER BY created_at ASC
      LIMIT (SELECT COUNT(*) FROM audits) - 300
    )
    AND (SELECT COUNT(*) FROM audits) > 300
  `).run(), { success: !0, data: e }), Ph = () => X.prepare("SELECT * FROM audits ORDER BY created_at DESC").all(), Fh = () => X.prepare("SELECT * FROM audits WHERE is_synced = 0").all(), Lh = (e) => X.prepare("UPDATE audits SET is_synced = 1 WHERE id = ?").run(e).changes === 0 ? { success: !1, error: "Update failed: Audit not found." } : { success: !0 };
var Re = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Pc(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Mt = {}, Bt = {}, De = {};
De.fromCallback = function(e) {
  return Object.defineProperty(function(...t) {
    if (typeof t[t.length - 1] == "function") e.apply(this, t);
    else
      return new Promise((r, n) => {
        t.push((i, s) => i != null ? n(i) : r(s)), e.apply(this, t);
      });
  }, "name", { value: e.name });
};
De.fromPromise = function(e) {
  return Object.defineProperty(function(...t) {
    const r = t[t.length - 1];
    if (typeof r != "function") return e.apply(this, t);
    t.pop(), e.apply(this, t).then((n) => r(null, n), r);
  }, "name", { value: e.name });
};
var dt = ah, xh = process.cwd, Fn = null, Uh = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return Fn || (Fn = xh.call(process)), Fn;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var ra = process.chdir;
  process.chdir = function(e) {
    Fn = null, ra.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, ra);
}
var kh = Mh;
function Mh(e) {
  dt.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || r(e), e.chown = s(e.chown), e.fchown = s(e.fchown), e.lchown = s(e.lchown), e.chmod = n(e.chmod), e.fchmod = n(e.fchmod), e.lchmod = n(e.lchmod), e.chownSync = o(e.chownSync), e.fchownSync = o(e.fchownSync), e.lchownSync = o(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = a(e.stat), e.fstat = a(e.fstat), e.lstat = a(e.lstat), e.statSync = l(e.statSync), e.fstatSync = l(e.fstatSync), e.lstatSync = l(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(c, u, h) {
    h && process.nextTick(h);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(c, u, h, m) {
    m && process.nextTick(m);
  }, e.lchownSync = function() {
  }), Uh === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(c) {
    function u(h, m, _) {
      var y = Date.now(), w = 0;
      c(h, m, function S(A) {
        if (A && (A.code === "EACCES" || A.code === "EPERM" || A.code === "EBUSY") && Date.now() - y < 6e4) {
          setTimeout(function() {
            e.stat(m, function(D, L) {
              D && D.code === "ENOENT" ? c(h, m, S) : _(A);
            });
          }, w), w < 100 && (w += 10);
          return;
        }
        _ && _(A);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(c) {
    function u(h, m, _, y, w, S) {
      var A;
      if (S && typeof S == "function") {
        var D = 0;
        A = function(L, B, H) {
          if (L && L.code === "EAGAIN" && D < 10)
            return D++, c.call(e, h, m, _, y, w, A);
          S.apply(this, arguments);
        };
      }
      return c.call(e, h, m, _, y, w, A);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(c) {
    return function(u, h, m, _, y) {
      for (var w = 0; ; )
        try {
          return c.call(e, u, h, m, _, y);
        } catch (S) {
          if (S.code === "EAGAIN" && w < 10) {
            w++;
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
        function(_, y) {
          if (_) {
            m && m(_);
            return;
          }
          c.fchmod(y, h, function(w) {
            c.close(y, function(S) {
              m && m(w || S);
            });
          });
        }
      );
    }, c.lchmodSync = function(u, h) {
      var m = c.openSync(u, dt.O_WRONLY | dt.O_SYMLINK, h), _ = !0, y;
      try {
        y = c.fchmodSync(m, h), _ = !1;
      } finally {
        if (_)
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
    dt.hasOwnProperty("O_SYMLINK") && c.futimes ? (c.lutimes = function(u, h, m, _) {
      c.open(u, dt.O_SYMLINK, function(y, w) {
        if (y) {
          _ && _(y);
          return;
        }
        c.futimes(w, h, m, function(S) {
          c.close(w, function(A) {
            _ && _(S || A);
          });
        });
      });
    }, c.lutimesSync = function(u, h, m) {
      var _ = c.openSync(u, dt.O_SYMLINK), y, w = !0;
      try {
        y = c.futimesSync(_, h, m), w = !1;
      } finally {
        if (w)
          try {
            c.closeSync(_);
          } catch {
          }
        else
          c.closeSync(_);
      }
      return y;
    }) : c.futimes && (c.lutimes = function(u, h, m, _) {
      _ && process.nextTick(_);
    }, c.lutimesSync = function() {
    });
  }
  function n(c) {
    return c && function(u, h, m) {
      return c.call(e, u, h, function(_) {
        f(_) && (_ = null), m && m.apply(this, arguments);
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
  function s(c) {
    return c && function(u, h, m, _) {
      return c.call(e, u, h, m, function(y) {
        f(y) && (y = null), _ && _.apply(this, arguments);
      });
    };
  }
  function o(c) {
    return c && function(u, h, m) {
      try {
        return c.call(e, u, h, m);
      } catch (_) {
        if (!f(_)) throw _;
      }
    };
  }
  function a(c) {
    return c && function(u, h, m) {
      typeof h == "function" && (m = h, h = null);
      function _(y, w) {
        w && (w.uid < 0 && (w.uid += 4294967296), w.gid < 0 && (w.gid += 4294967296)), m && m.apply(this, arguments);
      }
      return h ? c.call(e, u, h, _) : c.call(e, u, _);
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
var na = Xr.Stream, jh = Bh;
function Bh(e) {
  return {
    ReadStream: t,
    WriteStream: r
  };
  function t(n, i) {
    if (!(this instanceof t)) return new t(n, i);
    na.call(this);
    var s = this;
    this.path = n, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var o = Object.keys(i), a = 0, l = o.length; a < l; a++) {
      var f = o[a];
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
        s._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(c, u) {
      if (c) {
        s.emit("error", c), s.readable = !1;
        return;
      }
      s.fd = u, s.emit("open", u), s._read();
    });
  }
  function r(n, i) {
    if (!(this instanceof r)) return new r(n, i);
    na.call(this), this.path = n, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var s = Object.keys(i), o = 0, a = s.length; o < a; o++) {
      var l = s[o];
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
var Hh = Gh, qh = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function Gh(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: qh(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(r) {
    Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
  }), t;
}
var ae = $e, Vh = kh, Wh = jh, Yh = Hh, yn = Zn, we, jn;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (we = Symbol.for("graceful-fs.queue"), jn = Symbol.for("graceful-fs.previous")) : (we = "___graceful-fs.queue", jn = "___graceful-fs.previous");
function zh() {
}
function Fc(e, t) {
  Object.defineProperty(e, we, {
    get: function() {
      return t;
    }
  });
}
var Ut = zh;
yn.debuglog ? Ut = yn.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Ut = function() {
  var e = yn.format.apply(yn, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!ae[we]) {
  var Xh = Re[we] || [];
  Fc(ae, Xh), ae.close = function(e) {
    function t(r, n) {
      return e.call(ae, r, function(i) {
        i || ia(), typeof n == "function" && n.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, jn, {
      value: e
    }), t;
  }(ae.close), ae.closeSync = function(e) {
    function t(r) {
      e.apply(ae, arguments), ia();
    }
    return Object.defineProperty(t, jn, {
      value: e
    }), t;
  }(ae.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    Ut(ae[we]), Rc.equal(ae[we].length, 0);
  });
}
Re[we] || Fc(Re, ae[we]);
var Pe = io(Yh(ae));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !ae.__patched && (Pe = io(ae), ae.__patched = !0);
function io(e) {
  Vh(e), e.gracefulify = io, e.createReadStream = B, e.createWriteStream = H;
  var t = e.readFile;
  e.readFile = r;
  function r(E, Y, q) {
    return typeof Y == "function" && (q = Y, Y = null), M(E, Y, q);
    function M(ee, I, C, $) {
      return t(ee, I, function(O) {
        O && (O.code === "EMFILE" || O.code === "ENFILE") ? Wt([M, [ee, I, C], O, $ || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var n = e.writeFile;
  e.writeFile = i;
  function i(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = null), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return n(I, C, $, function(N) {
        N && (N.code === "EMFILE" || N.code === "ENFILE") ? Wt([ee, [I, C, $, O], N, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var s = e.appendFile;
  s && (e.appendFile = o);
  function o(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = null), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return s(I, C, $, function(N) {
        N && (N.code === "EMFILE" || N.code === "ENFILE") ? Wt([ee, [I, C, $, O], N, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var a = e.copyFile;
  a && (e.copyFile = l);
  function l(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = 0), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return a(I, C, $, function(N) {
        N && (N.code === "EMFILE" || N.code === "ENFILE") ? Wt([ee, [I, C, $, O], N, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
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
      return function(P, N) {
        P && (P.code === "EMFILE" || P.code === "ENFILE") ? Wt([
          M,
          [I, C, $],
          P,
          O || Date.now(),
          Date.now()
        ]) : (N && N.sort && N.sort(), typeof $ == "function" && $.call(this, P, N));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var h = Wh(e);
    S = h.ReadStream, D = h.WriteStream;
  }
  var m = e.ReadStream;
  m && (S.prototype = Object.create(m.prototype), S.prototype.open = A);
  var _ = e.WriteStream;
  _ && (D.prototype = Object.create(_.prototype), D.prototype.open = L), Object.defineProperty(e, "ReadStream", {
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
  var w = D;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return w;
    },
    set: function(E) {
      w = E;
    },
    enumerable: !0,
    configurable: !0
  });
  function S(E, Y) {
    return this instanceof S ? (m.apply(this, arguments), this) : S.apply(Object.create(S.prototype), arguments);
  }
  function A() {
    var E = this;
    ue(E.path, E.flags, E.mode, function(Y, q) {
      Y ? (E.autoClose && E.destroy(), E.emit("error", Y)) : (E.fd = q, E.emit("open", q), E.read());
    });
  }
  function D(E, Y) {
    return this instanceof D ? (_.apply(this, arguments), this) : D.apply(Object.create(D.prototype), arguments);
  }
  function L() {
    var E = this;
    ue(E.path, E.flags, E.mode, function(Y, q) {
      Y ? (E.destroy(), E.emit("error", Y)) : (E.fd = q, E.emit("open", q));
    });
  }
  function B(E, Y) {
    return new e.ReadStream(E, Y);
  }
  function H(E, Y) {
    return new e.WriteStream(E, Y);
  }
  var j = e.open;
  e.open = ue;
  function ue(E, Y, q, M) {
    return typeof q == "function" && (M = q, q = null), ee(E, Y, q, M);
    function ee(I, C, $, O, P) {
      return j(I, C, $, function(N, k) {
        N && (N.code === "EMFILE" || N.code === "ENFILE") ? Wt([ee, [I, C, $, O], N, P || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  return e;
}
function Wt(e) {
  Ut("ENQUEUE", e[0].name, e[1]), ae[we].push(e), so();
}
var vn;
function ia() {
  for (var e = Date.now(), t = 0; t < ae[we].length; ++t)
    ae[we][t].length > 2 && (ae[we][t][3] = e, ae[we][t][4] = e);
  so();
}
function so() {
  if (clearTimeout(vn), vn = void 0, ae[we].length !== 0) {
    var e = ae[we].shift(), t = e[0], r = e[1], n = e[2], i = e[3], s = e[4];
    if (i === void 0)
      Ut("RETRY", t.name, r), t.apply(null, r);
    else if (Date.now() - i >= 6e4) {
      Ut("TIMEOUT", t.name, r);
      var o = r.pop();
      typeof o == "function" && o.call(null, n);
    } else {
      var a = Date.now() - s, l = Math.max(s - i, 1), f = Math.min(l * 1.2, 100);
      a >= f ? (Ut("RETRY", t.name, r), t.apply(null, r.concat([i]))) : ae[we].push(e);
    }
    vn === void 0 && (vn = setTimeout(so, 0));
  }
}
(function(e) {
  const t = De.fromCallback, r = Pe, n = [
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
  }), e.exists = function(i, s) {
    return typeof s == "function" ? r.exists(i, s) : new Promise((o) => r.exists(i, o));
  }, e.read = function(i, s, o, a, l, f) {
    return typeof f == "function" ? r.read(i, s, o, a, l, f) : new Promise((c, u) => {
      r.read(i, s, o, a, l, (h, m, _) => {
        if (h) return u(h);
        c({ bytesRead: m, buffer: _ });
      });
    });
  }, e.write = function(i, s, ...o) {
    return typeof o[o.length - 1] == "function" ? r.write(i, s, ...o) : new Promise((a, l) => {
      r.write(i, s, ...o, (f, c, u) => {
        if (f) return l(f);
        a({ bytesWritten: c, buffer: u });
      });
    });
  }, typeof r.writev == "function" && (e.writev = function(i, s, ...o) {
    return typeof o[o.length - 1] == "function" ? r.writev(i, s, ...o) : new Promise((a, l) => {
      r.writev(i, s, ...o, (f, c, u) => {
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
var oo = {}, Lc = {};
const Kh = Z;
Lc.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(Kh.parse(t).root, ""))) {
    const n = new Error(`Path contains invalid characters: ${t}`);
    throw n.code = "EINVAL", n;
  }
};
const xc = Bt, { checkPath: Uc } = Lc, kc = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
oo.makeDir = async (e, t) => (Uc(e), xc.mkdir(e, {
  mode: kc(t),
  recursive: !0
}));
oo.makeDirSync = (e, t) => (Uc(e), xc.mkdirSync(e, {
  mode: kc(t),
  recursive: !0
}));
const Jh = De.fromPromise, { makeDir: Qh, makeDirSync: Di } = oo, Pi = Jh(Qh);
var et = {
  mkdirs: Pi,
  mkdirsSync: Di,
  // alias
  mkdirp: Pi,
  mkdirpSync: Di,
  ensureDir: Pi,
  ensureDirSync: Di
};
const Zh = De.fromPromise, Mc = Bt;
function ep(e) {
  return Mc.access(e).then(() => !0).catch(() => !1);
}
var Ht = {
  pathExists: Zh(ep),
  pathExistsSync: Mc.existsSync
};
const sr = Pe;
function tp(e, t, r, n) {
  sr.open(e, "r+", (i, s) => {
    if (i) return n(i);
    sr.futimes(s, t, r, (o) => {
      sr.close(s, (a) => {
        n && n(o || a);
      });
    });
  });
}
function rp(e, t, r) {
  const n = sr.openSync(e, "r+");
  return sr.futimesSync(n, t, r), sr.closeSync(n);
}
var jc = {
  utimesMillis: tp,
  utimesMillisSync: rp
};
const ar = Bt, Ee = Z, np = Zn;
function ip(e, t, r) {
  const n = r.dereference ? (i) => ar.stat(i, { bigint: !0 }) : (i) => ar.lstat(i, { bigint: !0 });
  return Promise.all([
    n(e),
    n(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, s]) => ({ srcStat: i, destStat: s }));
}
function sp(e, t, r) {
  let n;
  const i = r.dereference ? (o) => ar.statSync(o, { bigint: !0 }) : (o) => ar.lstatSync(o, { bigint: !0 }), s = i(e);
  try {
    n = i(t);
  } catch (o) {
    if (o.code === "ENOENT") return { srcStat: s, destStat: null };
    throw o;
  }
  return { srcStat: s, destStat: n };
}
function op(e, t, r, n, i) {
  np.callbackify(ip)(e, t, n, (s, o) => {
    if (s) return i(s);
    const { srcStat: a, destStat: l } = o;
    if (l) {
      if (Jr(a, l)) {
        const f = Ee.basename(e), c = Ee.basename(t);
        return r === "move" && f !== c && f.toLowerCase() === c.toLowerCase() ? i(null, { srcStat: a, destStat: l, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (a.isDirectory() && !l.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!a.isDirectory() && l.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return a.isDirectory() && ao(e, t) ? i(new Error(ti(e, t, r))) : i(null, { srcStat: a, destStat: l });
  });
}
function ap(e, t, r, n) {
  const { srcStat: i, destStat: s } = sp(e, t, n);
  if (s) {
    if (Jr(i, s)) {
      const o = Ee.basename(e), a = Ee.basename(t);
      if (r === "move" && o !== a && o.toLowerCase() === a.toLowerCase())
        return { srcStat: i, destStat: s, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !s.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && s.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && ao(e, t))
    throw new Error(ti(e, t, r));
  return { srcStat: i, destStat: s };
}
function Bc(e, t, r, n, i) {
  const s = Ee.resolve(Ee.dirname(e)), o = Ee.resolve(Ee.dirname(r));
  if (o === s || o === Ee.parse(o).root) return i();
  ar.stat(o, { bigint: !0 }, (a, l) => a ? a.code === "ENOENT" ? i() : i(a) : Jr(t, l) ? i(new Error(ti(e, r, n))) : Bc(e, t, o, n, i));
}
function Hc(e, t, r, n) {
  const i = Ee.resolve(Ee.dirname(e)), s = Ee.resolve(Ee.dirname(r));
  if (s === i || s === Ee.parse(s).root) return;
  let o;
  try {
    o = ar.statSync(s, { bigint: !0 });
  } catch (a) {
    if (a.code === "ENOENT") return;
    throw a;
  }
  if (Jr(t, o))
    throw new Error(ti(e, r, n));
  return Hc(e, t, s, n);
}
function Jr(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function ao(e, t) {
  const r = Ee.resolve(e).split(Ee.sep).filter((i) => i), n = Ee.resolve(t).split(Ee.sep).filter((i) => i);
  return r.reduce((i, s, o) => i && n[o] === s, !0);
}
function ti(e, t, r) {
  return `Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`;
}
var hr = {
  checkPaths: op,
  checkPathsSync: ap,
  checkParentPaths: Bc,
  checkParentPathsSync: Hc,
  isSrcSubdir: ao,
  areIdentical: Jr
};
const Ue = Pe, Pr = Z, lp = et.mkdirs, cp = Ht.pathExists, up = jc.utimesMillis, Fr = hr;
function fp(e, t, r, n) {
  typeof r == "function" && !n ? (n = r, r = {}) : typeof r == "function" && (r = { filter: r }), n = n || function() {
  }, r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Fr.checkPaths(e, t, "copy", r, (i, s) => {
    if (i) return n(i);
    const { srcStat: o, destStat: a } = s;
    Fr.checkParentPaths(e, o, t, "copy", (l) => l ? n(l) : r.filter ? qc(sa, a, e, t, r, n) : sa(a, e, t, r, n));
  });
}
function sa(e, t, r, n, i) {
  const s = Pr.dirname(r);
  cp(s, (o, a) => {
    if (o) return i(o);
    if (a) return Bn(e, t, r, n, i);
    lp(s, (l) => l ? i(l) : Bn(e, t, r, n, i));
  });
}
function qc(e, t, r, n, i, s) {
  Promise.resolve(i.filter(r, n)).then((o) => o ? e(t, r, n, i, s) : s(), (o) => s(o));
}
function dp(e, t, r, n, i) {
  return n.filter ? qc(Bn, e, t, r, n, i) : Bn(e, t, r, n, i);
}
function Bn(e, t, r, n, i) {
  (n.dereference ? Ue.stat : Ue.lstat)(t, (o, a) => o ? i(o) : a.isDirectory() ? vp(a, e, t, r, n, i) : a.isFile() || a.isCharacterDevice() || a.isBlockDevice() ? hp(a, e, t, r, n, i) : a.isSymbolicLink() ? Tp(e, t, r, n, i) : a.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : a.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function hp(e, t, r, n, i, s) {
  return t ? pp(e, r, n, i, s) : Gc(e, r, n, i, s);
}
function pp(e, t, r, n, i) {
  if (n.overwrite)
    Ue.unlink(r, (s) => s ? i(s) : Gc(e, t, r, n, i));
  else return n.errorOnExist ? i(new Error(`'${r}' already exists`)) : i();
}
function Gc(e, t, r, n, i) {
  Ue.copyFile(t, r, (s) => s ? i(s) : n.preserveTimestamps ? mp(e.mode, t, r, i) : ri(r, e.mode, i));
}
function mp(e, t, r, n) {
  return gp(e) ? Ep(r, e, (i) => i ? n(i) : oa(e, t, r, n)) : oa(e, t, r, n);
}
function gp(e) {
  return (e & 128) === 0;
}
function Ep(e, t, r) {
  return ri(e, t | 128, r);
}
function oa(e, t, r, n) {
  yp(t, r, (i) => i ? n(i) : ri(r, e, n));
}
function ri(e, t, r) {
  return Ue.chmod(e, t, r);
}
function yp(e, t, r) {
  Ue.stat(e, (n, i) => n ? r(n) : up(t, i.atime, i.mtime, r));
}
function vp(e, t, r, n, i, s) {
  return t ? Vc(r, n, i, s) : _p(e.mode, r, n, i, s);
}
function _p(e, t, r, n, i) {
  Ue.mkdir(r, (s) => {
    if (s) return i(s);
    Vc(t, r, n, (o) => o ? i(o) : ri(r, e, i));
  });
}
function Vc(e, t, r, n) {
  Ue.readdir(e, (i, s) => i ? n(i) : Wc(s, e, t, r, n));
}
function Wc(e, t, r, n, i) {
  const s = e.pop();
  return s ? wp(e, s, t, r, n, i) : i();
}
function wp(e, t, r, n, i, s) {
  const o = Pr.join(r, t), a = Pr.join(n, t);
  Fr.checkPaths(o, a, "copy", i, (l, f) => {
    if (l) return s(l);
    const { destStat: c } = f;
    dp(c, o, a, i, (u) => u ? s(u) : Wc(e, r, n, i, s));
  });
}
function Tp(e, t, r, n, i) {
  Ue.readlink(t, (s, o) => {
    if (s) return i(s);
    if (n.dereference && (o = Pr.resolve(process.cwd(), o)), e)
      Ue.readlink(r, (a, l) => a ? a.code === "EINVAL" || a.code === "UNKNOWN" ? Ue.symlink(o, r, i) : i(a) : (n.dereference && (l = Pr.resolve(process.cwd(), l)), Fr.isSrcSubdir(o, l) ? i(new Error(`Cannot copy '${o}' to a subdirectory of itself, '${l}'.`)) : e.isDirectory() && Fr.isSrcSubdir(l, o) ? i(new Error(`Cannot overwrite '${l}' with '${o}'.`)) : Sp(o, r, i)));
    else
      return Ue.symlink(o, r, i);
  });
}
function Sp(e, t, r) {
  Ue.unlink(t, (n) => n ? r(n) : Ue.symlink(e, t, r));
}
var Ap = fp;
const be = Pe, Lr = Z, bp = et.mkdirsSync, Op = jc.utimesMillisSync, xr = hr;
function Cp(e, t, r) {
  typeof r == "function" && (r = { filter: r }), r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: n, destStat: i } = xr.checkPathsSync(e, t, "copy", r);
  return xr.checkParentPathsSync(e, n, t, "copy"), Rp(i, e, t, r);
}
function Rp(e, t, r, n) {
  if (n.filter && !n.filter(t, r)) return;
  const i = Lr.dirname(r);
  return be.existsSync(i) || bp(i), Yc(e, t, r, n);
}
function Ip(e, t, r, n) {
  if (!(n.filter && !n.filter(t, r)))
    return Yc(e, t, r, n);
}
function Yc(e, t, r, n) {
  const s = (n.dereference ? be.statSync : be.lstatSync)(t);
  if (s.isDirectory()) return xp(s, e, t, r, n);
  if (s.isFile() || s.isCharacterDevice() || s.isBlockDevice()) return Np(s, e, t, r, n);
  if (s.isSymbolicLink()) return Mp(e, t, r, n);
  throw s.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : s.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function Np(e, t, r, n, i) {
  return t ? $p(e, r, n, i) : zc(e, r, n, i);
}
function $p(e, t, r, n) {
  if (n.overwrite)
    return be.unlinkSync(r), zc(e, t, r, n);
  if (n.errorOnExist)
    throw new Error(`'${r}' already exists`);
}
function zc(e, t, r, n) {
  return be.copyFileSync(t, r), n.preserveTimestamps && Dp(e.mode, t, r), lo(r, e.mode);
}
function Dp(e, t, r) {
  return Pp(e) && Fp(r, e), Lp(t, r);
}
function Pp(e) {
  return (e & 128) === 0;
}
function Fp(e, t) {
  return lo(e, t | 128);
}
function lo(e, t) {
  return be.chmodSync(e, t);
}
function Lp(e, t) {
  const r = be.statSync(e);
  return Op(t, r.atime, r.mtime);
}
function xp(e, t, r, n, i) {
  return t ? Xc(r, n, i) : Up(e.mode, r, n, i);
}
function Up(e, t, r, n) {
  return be.mkdirSync(r), Xc(t, r, n), lo(r, e);
}
function Xc(e, t, r) {
  be.readdirSync(e).forEach((n) => kp(n, e, t, r));
}
function kp(e, t, r, n) {
  const i = Lr.join(t, e), s = Lr.join(r, e), { destStat: o } = xr.checkPathsSync(i, s, "copy", n);
  return Ip(o, i, s, n);
}
function Mp(e, t, r, n) {
  let i = be.readlinkSync(t);
  if (n.dereference && (i = Lr.resolve(process.cwd(), i)), e) {
    let s;
    try {
      s = be.readlinkSync(r);
    } catch (o) {
      if (o.code === "EINVAL" || o.code === "UNKNOWN") return be.symlinkSync(i, r);
      throw o;
    }
    if (n.dereference && (s = Lr.resolve(process.cwd(), s)), xr.isSrcSubdir(i, s))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${s}'.`);
    if (be.statSync(r).isDirectory() && xr.isSrcSubdir(s, i))
      throw new Error(`Cannot overwrite '${s}' with '${i}'.`);
    return jp(i, r);
  } else
    return be.symlinkSync(i, r);
}
function jp(e, t) {
  return be.unlinkSync(t), be.symlinkSync(e, t);
}
var Bp = Cp;
const Hp = De.fromCallback;
var co = {
  copy: Hp(Ap),
  copySync: Bp
};
const aa = Pe, Kc = Z, re = Rc, Ur = process.platform === "win32";
function Jc(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((r) => {
    e[r] = e[r] || aa[r], r = r + "Sync", e[r] = e[r] || aa[r];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function uo(e, t, r) {
  let n = 0;
  typeof t == "function" && (r = t, t = {}), re(e, "rimraf: missing path"), re.strictEqual(typeof e, "string", "rimraf: path should be a string"), re.strictEqual(typeof r, "function", "rimraf: callback function required"), re(t, "rimraf: invalid options argument provided"), re.strictEqual(typeof t, "object", "rimraf: options should be object"), Jc(t), la(e, t, function i(s) {
    if (s) {
      if ((s.code === "EBUSY" || s.code === "ENOTEMPTY" || s.code === "EPERM") && n < t.maxBusyTries) {
        n++;
        const o = n * 100;
        return setTimeout(() => la(e, t, i), o);
      }
      s.code === "ENOENT" && (s = null);
    }
    r(s);
  });
}
function la(e, t, r) {
  re(e), re(t), re(typeof r == "function"), t.lstat(e, (n, i) => {
    if (n && n.code === "ENOENT")
      return r(null);
    if (n && n.code === "EPERM" && Ur)
      return ca(e, t, n, r);
    if (i && i.isDirectory())
      return Ln(e, t, n, r);
    t.unlink(e, (s) => {
      if (s) {
        if (s.code === "ENOENT")
          return r(null);
        if (s.code === "EPERM")
          return Ur ? ca(e, t, s, r) : Ln(e, t, s, r);
        if (s.code === "EISDIR")
          return Ln(e, t, s, r);
      }
      return r(s);
    });
  });
}
function ca(e, t, r, n) {
  re(e), re(t), re(typeof n == "function"), t.chmod(e, 438, (i) => {
    i ? n(i.code === "ENOENT" ? null : r) : t.stat(e, (s, o) => {
      s ? n(s.code === "ENOENT" ? null : r) : o.isDirectory() ? Ln(e, t, r, n) : t.unlink(e, n);
    });
  });
}
function ua(e, t, r) {
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
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? qp(e, t, n) : i && i.code === "ENOTDIR" ? n(r) : n(i);
  });
}
function qp(e, t, r) {
  re(e), re(t), re(typeof r == "function"), t.readdir(e, (n, i) => {
    if (n) return r(n);
    let s = i.length, o;
    if (s === 0) return t.rmdir(e, r);
    i.forEach((a) => {
      uo(Kc.join(e, a), t, (l) => {
        if (!o) {
          if (l) return r(o = l);
          --s === 0 && t.rmdir(e, r);
        }
      });
    });
  });
}
function Qc(e, t) {
  let r;
  t = t || {}, Jc(t), re(e, "rimraf: missing path"), re.strictEqual(typeof e, "string", "rimraf: path should be a string"), re(t, "rimraf: missing options"), re.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    r = t.lstatSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    n.code === "EPERM" && Ur && ua(e, t, n);
  }
  try {
    r && r.isDirectory() ? xn(e, t, null) : t.unlinkSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    if (n.code === "EPERM")
      return Ur ? ua(e, t, n) : xn(e, t, n);
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
      Gp(e, t);
    else if (n.code !== "ENOENT")
      throw n;
  }
}
function Gp(e, t) {
  if (re(e), re(t), t.readdirSync(e).forEach((r) => Qc(Kc.join(e, r), t)), Ur) {
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
var Vp = uo;
uo.sync = Qc;
const Hn = Pe, Wp = De.fromCallback, Zc = Vp;
function Yp(e, t) {
  if (Hn.rm) return Hn.rm(e, { recursive: !0, force: !0 }, t);
  Zc(e, t);
}
function zp(e) {
  if (Hn.rmSync) return Hn.rmSync(e, { recursive: !0, force: !0 });
  Zc.sync(e);
}
var ni = {
  remove: Wp(Yp),
  removeSync: zp
};
const Xp = De.fromPromise, eu = Bt, tu = Z, ru = et, nu = ni, fa = Xp(async function(t) {
  let r;
  try {
    r = await eu.readdir(t);
  } catch {
    return ru.mkdirs(t);
  }
  return Promise.all(r.map((n) => nu.remove(tu.join(t, n))));
});
function da(e) {
  let t;
  try {
    t = eu.readdirSync(e);
  } catch {
    return ru.mkdirsSync(e);
  }
  t.forEach((r) => {
    r = tu.join(e, r), nu.removeSync(r);
  });
}
var Kp = {
  emptyDirSync: da,
  emptydirSync: da,
  emptyDir: fa,
  emptydir: fa
};
const Jp = De.fromCallback, iu = Z, mt = Pe, su = et;
function Qp(e, t) {
  function r() {
    mt.writeFile(e, "", (n) => {
      if (n) return t(n);
      t();
    });
  }
  mt.stat(e, (n, i) => {
    if (!n && i.isFile()) return t();
    const s = iu.dirname(e);
    mt.stat(s, (o, a) => {
      if (o)
        return o.code === "ENOENT" ? su.mkdirs(s, (l) => {
          if (l) return t(l);
          r();
        }) : t(o);
      a.isDirectory() ? r() : mt.readdir(s, (l) => {
        if (l) return t(l);
      });
    });
  });
}
function Zp(e) {
  let t;
  try {
    t = mt.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const r = iu.dirname(e);
  try {
    mt.statSync(r).isDirectory() || mt.readdirSync(r);
  } catch (n) {
    if (n && n.code === "ENOENT") su.mkdirsSync(r);
    else throw n;
  }
  mt.writeFileSync(e, "");
}
var em = {
  createFile: Jp(Qp),
  createFileSync: Zp
};
const tm = De.fromCallback, ou = Z, pt = Pe, au = et, rm = Ht.pathExists, { areIdentical: lu } = hr;
function nm(e, t, r) {
  function n(i, s) {
    pt.link(i, s, (o) => {
      if (o) return r(o);
      r(null);
    });
  }
  pt.lstat(t, (i, s) => {
    pt.lstat(e, (o, a) => {
      if (o)
        return o.message = o.message.replace("lstat", "ensureLink"), r(o);
      if (s && lu(a, s)) return r(null);
      const l = ou.dirname(t);
      rm(l, (f, c) => {
        if (f) return r(f);
        if (c) return n(e, t);
        au.mkdirs(l, (u) => {
          if (u) return r(u);
          n(e, t);
        });
      });
    });
  });
}
function im(e, t) {
  let r;
  try {
    r = pt.lstatSync(t);
  } catch {
  }
  try {
    const s = pt.lstatSync(e);
    if (r && lu(s, r)) return;
  } catch (s) {
    throw s.message = s.message.replace("lstat", "ensureLink"), s;
  }
  const n = ou.dirname(t);
  return pt.existsSync(n) || au.mkdirsSync(n), pt.linkSync(e, t);
}
var sm = {
  createLink: tm(nm),
  createLinkSync: im
};
const gt = Z, Ir = Pe, om = Ht.pathExists;
function am(e, t, r) {
  if (gt.isAbsolute(e))
    return Ir.lstat(e, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), r(n)) : r(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const n = gt.dirname(t), i = gt.join(n, e);
    return om(i, (s, o) => s ? r(s) : o ? r(null, {
      toCwd: i,
      toDst: e
    }) : Ir.lstat(e, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), r(a)) : r(null, {
      toCwd: e,
      toDst: gt.relative(n, e)
    })));
  }
}
function lm(e, t) {
  let r;
  if (gt.isAbsolute(e)) {
    if (r = Ir.existsSync(e), !r) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const n = gt.dirname(t), i = gt.join(n, e);
    if (r = Ir.existsSync(i), r)
      return {
        toCwd: i,
        toDst: e
      };
    if (r = Ir.existsSync(e), !r) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: gt.relative(n, e)
    };
  }
}
var cm = {
  symlinkPaths: am,
  symlinkPathsSync: lm
};
const cu = Pe;
function um(e, t, r) {
  if (r = typeof t == "function" ? t : r, t = typeof t == "function" ? !1 : t, t) return r(null, t);
  cu.lstat(e, (n, i) => {
    if (n) return r(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", r(null, t);
  });
}
function fm(e, t) {
  let r;
  if (t) return t;
  try {
    r = cu.lstatSync(e);
  } catch {
    return "file";
  }
  return r && r.isDirectory() ? "dir" : "file";
}
var dm = {
  symlinkType: um,
  symlinkTypeSync: fm
};
const hm = De.fromCallback, uu = Z, We = Bt, fu = et, pm = fu.mkdirs, mm = fu.mkdirsSync, du = cm, gm = du.symlinkPaths, Em = du.symlinkPathsSync, hu = dm, ym = hu.symlinkType, vm = hu.symlinkTypeSync, _m = Ht.pathExists, { areIdentical: pu } = hr;
function wm(e, t, r, n) {
  n = typeof r == "function" ? r : n, r = typeof r == "function" ? !1 : r, We.lstat(t, (i, s) => {
    !i && s.isSymbolicLink() ? Promise.all([
      We.stat(e),
      We.stat(t)
    ]).then(([o, a]) => {
      if (pu(o, a)) return n(null);
      ha(e, t, r, n);
    }) : ha(e, t, r, n);
  });
}
function ha(e, t, r, n) {
  gm(e, t, (i, s) => {
    if (i) return n(i);
    e = s.toDst, ym(s.toCwd, r, (o, a) => {
      if (o) return n(o);
      const l = uu.dirname(t);
      _m(l, (f, c) => {
        if (f) return n(f);
        if (c) return We.symlink(e, t, a, n);
        pm(l, (u) => {
          if (u) return n(u);
          We.symlink(e, t, a, n);
        });
      });
    });
  });
}
function Tm(e, t, r) {
  let n;
  try {
    n = We.lstatSync(t);
  } catch {
  }
  if (n && n.isSymbolicLink()) {
    const a = We.statSync(e), l = We.statSync(t);
    if (pu(a, l)) return;
  }
  const i = Em(e, t);
  e = i.toDst, r = vm(i.toCwd, r);
  const s = uu.dirname(t);
  return We.existsSync(s) || mm(s), We.symlinkSync(e, t, r);
}
var Sm = {
  createSymlink: hm(wm),
  createSymlinkSync: Tm
};
const { createFile: pa, createFileSync: ma } = em, { createLink: ga, createLinkSync: Ea } = sm, { createSymlink: ya, createSymlinkSync: va } = Sm;
var Am = {
  // file
  createFile: pa,
  createFileSync: ma,
  ensureFile: pa,
  ensureFileSync: ma,
  // link
  createLink: ga,
  createLinkSync: Ea,
  ensureLink: ga,
  ensureLinkSync: Ea,
  // symlink
  createSymlink: ya,
  createSymlinkSync: va,
  ensureSymlink: ya,
  ensureSymlinkSync: va
};
function bm(e, { EOL: t = `
`, finalEOL: r = !0, replacer: n = null, spaces: i } = {}) {
  const s = r ? t : "";
  return JSON.stringify(e, n, i).replace(/\n/g, t) + s;
}
function Om(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var fo = { stringify: bm, stripBom: Om };
let lr;
try {
  lr = Pe;
} catch {
  lr = $e;
}
const ii = De, { stringify: mu, stripBom: gu } = fo;
async function Cm(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || lr, n = "throws" in t ? t.throws : !0;
  let i = await ii.fromCallback(r.readFile)(e, t);
  i = gu(i);
  let s;
  try {
    s = JSON.parse(i, t ? t.reviver : null);
  } catch (o) {
    if (n)
      throw o.message = `${e}: ${o.message}`, o;
    return null;
  }
  return s;
}
const Rm = ii.fromPromise(Cm);
function Im(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || lr, n = "throws" in t ? t.throws : !0;
  try {
    let i = r.readFileSync(e, t);
    return i = gu(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (n)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function Nm(e, t, r = {}) {
  const n = r.fs || lr, i = mu(t, r);
  await ii.fromCallback(n.writeFile)(e, i, r);
}
const $m = ii.fromPromise(Nm);
function Dm(e, t, r = {}) {
  const n = r.fs || lr, i = mu(t, r);
  return n.writeFileSync(e, i, r);
}
const Pm = {
  readFile: Rm,
  readFileSync: Im,
  writeFile: $m,
  writeFileSync: Dm
};
var Fm = Pm;
const _n = Fm;
var Lm = {
  // jsonfile exports
  readJson: _n.readFile,
  readJsonSync: _n.readFileSync,
  writeJson: _n.writeFile,
  writeJsonSync: _n.writeFileSync
};
const xm = De.fromCallback, Nr = Pe, Eu = Z, yu = et, Um = Ht.pathExists;
function km(e, t, r, n) {
  typeof r == "function" && (n = r, r = "utf8");
  const i = Eu.dirname(e);
  Um(i, (s, o) => {
    if (s) return n(s);
    if (o) return Nr.writeFile(e, t, r, n);
    yu.mkdirs(i, (a) => {
      if (a) return n(a);
      Nr.writeFile(e, t, r, n);
    });
  });
}
function Mm(e, ...t) {
  const r = Eu.dirname(e);
  if (Nr.existsSync(r))
    return Nr.writeFileSync(e, ...t);
  yu.mkdirsSync(r), Nr.writeFileSync(e, ...t);
}
var ho = {
  outputFile: xm(km),
  outputFileSync: Mm
};
const { stringify: jm } = fo, { outputFile: Bm } = ho;
async function Hm(e, t, r = {}) {
  const n = jm(t, r);
  await Bm(e, n, r);
}
var qm = Hm;
const { stringify: Gm } = fo, { outputFileSync: Vm } = ho;
function Wm(e, t, r) {
  const n = Gm(t, r);
  Vm(e, n, r);
}
var Ym = Wm;
const zm = De.fromPromise, Ne = Lm;
Ne.outputJson = zm(qm);
Ne.outputJsonSync = Ym;
Ne.outputJSON = Ne.outputJson;
Ne.outputJSONSync = Ne.outputJsonSync;
Ne.writeJSON = Ne.writeJson;
Ne.writeJSONSync = Ne.writeJsonSync;
Ne.readJSON = Ne.readJson;
Ne.readJSONSync = Ne.readJsonSync;
var Xm = Ne;
const Km = Pe, Us = Z, Jm = co.copy, vu = ni.remove, Qm = et.mkdirp, Zm = Ht.pathExists, _a = hr;
function eg(e, t, r, n) {
  typeof r == "function" && (n = r, r = {}), r = r || {};
  const i = r.overwrite || r.clobber || !1;
  _a.checkPaths(e, t, "move", r, (s, o) => {
    if (s) return n(s);
    const { srcStat: a, isChangingCase: l = !1 } = o;
    _a.checkParentPaths(e, a, t, "move", (f) => {
      if (f) return n(f);
      if (tg(t)) return wa(e, t, i, l, n);
      Qm(Us.dirname(t), (c) => c ? n(c) : wa(e, t, i, l, n));
    });
  });
}
function tg(e) {
  const t = Us.dirname(e);
  return Us.parse(t).root === t;
}
function wa(e, t, r, n, i) {
  if (n) return Fi(e, t, r, i);
  if (r)
    return vu(t, (s) => s ? i(s) : Fi(e, t, r, i));
  Zm(t, (s, o) => s ? i(s) : o ? i(new Error("dest already exists.")) : Fi(e, t, r, i));
}
function Fi(e, t, r, n) {
  Km.rename(e, t, (i) => i ? i.code !== "EXDEV" ? n(i) : rg(e, t, r, n) : n());
}
function rg(e, t, r, n) {
  Jm(e, t, {
    overwrite: r,
    errorOnExist: !0
  }, (s) => s ? n(s) : vu(e, n));
}
var ng = eg;
const _u = Pe, ks = Z, ig = co.copySync, wu = ni.removeSync, sg = et.mkdirpSync, Ta = hr;
function og(e, t, r) {
  r = r || {};
  const n = r.overwrite || r.clobber || !1, { srcStat: i, isChangingCase: s = !1 } = Ta.checkPathsSync(e, t, "move", r);
  return Ta.checkParentPathsSync(e, i, t, "move"), ag(t) || sg(ks.dirname(t)), lg(e, t, n, s);
}
function ag(e) {
  const t = ks.dirname(e);
  return ks.parse(t).root === t;
}
function lg(e, t, r, n) {
  if (n) return Li(e, t, r);
  if (r)
    return wu(t), Li(e, t, r);
  if (_u.existsSync(t)) throw new Error("dest already exists.");
  return Li(e, t, r);
}
function Li(e, t, r) {
  try {
    _u.renameSync(e, t);
  } catch (n) {
    if (n.code !== "EXDEV") throw n;
    return cg(e, t, r);
  }
}
function cg(e, t, r) {
  return ig(e, t, {
    overwrite: r,
    errorOnExist: !0
  }), wu(e);
}
var ug = og;
const fg = De.fromCallback;
var dg = {
  move: fg(ng),
  moveSync: ug
}, bt = {
  // Export promiseified graceful-fs:
  ...Bt,
  // Export extra methods:
  ...co,
  ...Kp,
  ...Am,
  ...Xm,
  ...et,
  ...dg,
  ...ho,
  ...Ht,
  ...ni
}, ot = {}, _t = {}, ye = {}, wt = {};
Object.defineProperty(wt, "__esModule", { value: !0 });
wt.CancellationError = wt.CancellationToken = void 0;
const hg = ei;
class pg extends hg.EventEmitter {
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
      return Promise.reject(new Ms());
    const r = () => {
      if (n != null)
        try {
          this.removeListener("cancel", n), n = null;
        } catch {
        }
    };
    let n = null;
    return new Promise((i, s) => {
      let o = null;
      if (n = () => {
        try {
          o != null && (o(), o = null);
        } finally {
          s(new Ms());
        }
      }, this.cancelled) {
        n();
        return;
      }
      this.onCancel(n), t(i, s, (a) => {
        o = a;
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
wt.CancellationToken = pg;
class Ms extends Error {
  constructor() {
    super("cancelled");
  }
}
wt.CancellationError = Ms;
var pr = {};
Object.defineProperty(pr, "__esModule", { value: !0 });
pr.newError = mg;
function mg(e, t) {
  const r = new Error(e);
  return r.code = t, r;
}
var Ie = {}, js = { exports: {} }, wn = { exports: {} }, xi, Sa;
function gg() {
  if (Sa) return xi;
  Sa = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, i = n * 7, s = n * 365.25;
  xi = function(c, u) {
    u = u || {};
    var h = typeof c;
    if (h === "string" && c.length > 0)
      return o(c);
    if (h === "number" && isFinite(c))
      return u.long ? l(c) : a(c);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(c)
    );
  };
  function o(c) {
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
            return h * s;
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
    var _ = u >= h * 1.5;
    return Math.round(c / h) + " " + m + (_ ? "s" : "");
  }
  return xi;
}
var Ui, Aa;
function Tu() {
  if (Aa) return Ui;
  Aa = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = f, n.disable = a, n.enable = s, n.enabled = l, n.humanize = gg(), n.destroy = c, Object.keys(t).forEach((u) => {
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
      let h, m = null, _, y;
      function w(...S) {
        if (!w.enabled)
          return;
        const A = w, D = Number(/* @__PURE__ */ new Date()), L = D - (h || D);
        A.diff = L, A.prev = h, A.curr = D, h = D, S[0] = n.coerce(S[0]), typeof S[0] != "string" && S.unshift("%O");
        let B = 0;
        S[0] = S[0].replace(/%([a-zA-Z%])/g, (j, ue) => {
          if (j === "%%")
            return "%";
          B++;
          const E = n.formatters[ue];
          if (typeof E == "function") {
            const Y = S[B];
            j = E.call(A, Y), S.splice(B, 1), B--;
          }
          return j;
        }), n.formatArgs.call(A, S), (A.log || n.log).apply(A, S);
      }
      return w.namespace = u, w.useColors = n.useColors(), w.color = n.selectColor(u), w.extend = i, w.destroy = n.destroy, Object.defineProperty(w, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (_ !== n.namespaces && (_ = n.namespaces, y = n.enabled(u)), y),
        set: (S) => {
          m = S;
        }
      }), typeof n.init == "function" && n.init(w), w;
    }
    function i(u, h) {
      const m = n(this.namespace + (typeof h > "u" ? ":" : h) + u);
      return m.log = this.log, m;
    }
    function s(u) {
      n.save(u), n.namespaces = u, n.names = [], n.skips = [];
      const h = (typeof u == "string" ? u : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const m of h)
        m[0] === "-" ? n.skips.push(m.slice(1)) : n.names.push(m);
    }
    function o(u, h) {
      let m = 0, _ = 0, y = -1, w = 0;
      for (; m < u.length; )
        if (_ < h.length && (h[_] === u[m] || h[_] === "*"))
          h[_] === "*" ? (y = _, w = m, _++) : (m++, _++);
        else if (y !== -1)
          _ = y + 1, w++, m = w;
        else
          return !1;
      for (; _ < h.length && h[_] === "*"; )
        _++;
      return _ === h.length;
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
        if (o(u, h))
          return !1;
      for (const h of n.names)
        if (o(u, h))
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
  return Ui = e, Ui;
}
var ba;
function Eg() {
  return ba || (ba = 1, function(e, t) {
    t.formatArgs = n, t.save = i, t.load = s, t.useColors = r, t.storage = o(), t.destroy = /* @__PURE__ */ (() => {
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
    function s() {
      let l;
      try {
        l = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !l && typeof process < "u" && "env" in process && (l = process.env.DEBUG), l;
    }
    function o() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = Tu()(t);
    const { formatters: a } = e.exports;
    a.j = function(l) {
      try {
        return JSON.stringify(l);
      } catch (f) {
        return "[UnexpectedJSONParseError]: " + f.message;
      }
    };
  }(wn, wn.exports)), wn.exports;
}
var Tn = { exports: {} }, ki, Oa;
function yg() {
  return Oa || (Oa = 1, ki = (e, t = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = t.indexOf(r + e), i = t.indexOf("--");
    return n !== -1 && (i === -1 || n < i);
  }), ki;
}
var Mi, Ca;
function vg() {
  if (Ca) return Mi;
  Ca = 1;
  const e = st, t = Ic, r = yg(), { env: n } = process;
  let i;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? i = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (i = 1), "FORCE_COLOR" in n && (n.FORCE_COLOR === "true" ? i = 1 : n.FORCE_COLOR === "false" ? i = 0 : i = n.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(n.FORCE_COLOR, 10), 3));
  function s(l) {
    return l === 0 ? !1 : {
      level: l,
      hasBasic: !0,
      has256: l >= 2,
      has16m: l >= 3
    };
  }
  function o(l, f) {
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
    const f = o(l, l && l.isTTY);
    return s(f);
  }
  return Mi = {
    supportsColor: a,
    stdout: s(o(!0, t.isatty(1))),
    stderr: s(o(!0, t.isatty(2)))
  }, Mi;
}
var Ra;
function _g() {
  return Ra || (Ra = 1, function(e, t) {
    const r = Ic, n = Zn;
    t.init = c, t.log = a, t.formatArgs = s, t.save = l, t.load = f, t.useColors = i, t.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = vg();
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
      const _ = m.substring(6).toLowerCase().replace(/_([a-z])/g, (w, S) => S.toUpperCase());
      let y = process.env[m];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), h[_] = y, h;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function s(h) {
      const { namespace: m, useColors: _ } = this;
      if (_) {
        const y = this.color, w = "\x1B[3" + (y < 8 ? y : "8;5;" + y), S = `  ${w};1m${m} \x1B[0m`;
        h[0] = S + h[0].split(`
`).join(`
` + S), h.push(w + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        h[0] = o() + m + " " + h[0];
    }
    function o() {
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
      for (let _ = 0; _ < m.length; _++)
        h.inspectOpts[m[_]] = t.inspectOpts[m[_]];
    }
    e.exports = Tu()(t);
    const { formatters: u } = e.exports;
    u.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, u.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(Tn, Tn.exports)), Tn.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? js.exports = Eg() : js.exports = _g();
var wg = js.exports, Qr = {};
Object.defineProperty(Qr, "__esModule", { value: !0 });
Qr.ProgressCallbackTransform = void 0;
const Tg = Xr;
class Sg extends Tg.Transform {
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
Qr.ProgressCallbackTransform = Sg;
Object.defineProperty(Ie, "__esModule", { value: !0 });
Ie.DigestTransform = Ie.HttpExecutor = Ie.HttpError = void 0;
Ie.createHttpError = Bs;
Ie.parseJson = $g;
Ie.configureRequestOptionsFromUrl = Au;
Ie.configureRequestUrl = mo;
Ie.safeGetHeader = or;
Ie.configureRequestOptions = Gn;
Ie.safeStringifyJson = Vn;
const Ag = fr, bg = wg, Og = $e, Cg = Xr, Su = dr, Rg = wt, Ia = pr, Ig = Qr, Tr = (0, bg.default)("electron-builder");
function Bs(e, t = null) {
  return new po(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + Vn(e.headers), t);
}
const Ng = /* @__PURE__ */ new Map([
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
class po extends Error {
  constructor(t, r = `HTTP error: ${Ng.get(t) || t}`, n = null) {
    super(r), this.statusCode = t, this.description = n, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
Ie.HttpError = po;
function $g(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class qn {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, r = new Rg.CancellationToken(), n) {
    Gn(t);
    const i = n == null ? void 0 : JSON.stringify(n), s = i ? Buffer.from(i) : void 0;
    if (s != null) {
      Tr(i);
      const { headers: o, ...a } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": s.length,
          ...o
        },
        ...a
      };
    }
    return this.doApiRequest(t, r, (o) => o.end(s));
  }
  doApiRequest(t, r, n, i = 0) {
    return Tr.enabled && Tr(`Request: ${Vn(t)}`), r.createPromise((s, o, a) => {
      const l = this.createRequest(t, (f) => {
        try {
          this.handleResponse(f, t, r, s, o, i, n);
        } catch (c) {
          o(c);
        }
      });
      this.addErrorAndTimeoutHandlers(l, o, t.timeout), this.addRedirectHandlers(l, t, o, i, (f) => {
        this.doApiRequest(f, r, n, i).then(s).catch(o);
      }), n(l, o), a(() => l.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, r, n, i, s) {
  }
  addErrorAndTimeoutHandlers(t, r, n = 60 * 1e3) {
    this.addTimeOutHandler(t, r, n), t.on("error", r), t.on("aborted", () => {
      r(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, r, n, i, s, o, a) {
    var l;
    if (Tr.enabled && Tr(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${Vn(r)}`), t.statusCode === 404) {
      s(Bs(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const f = (l = t.statusCode) !== null && l !== void 0 ? l : 0, c = f >= 300 && f < 400, u = or(t, "location");
    if (c && u != null) {
      if (o > this.maxRedirects) {
        s(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(qn.prepareRedirectUrlOptions(u, r), n, a, o).then(i).catch(s);
      return;
    }
    t.setEncoding("utf8");
    let h = "";
    t.on("error", s), t.on("data", (m) => h += m), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const m = or(t, "content-type"), _ = m != null && (Array.isArray(m) ? m.find((y) => y.includes("json")) != null : m.includes("json"));
          s(Bs(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

          Data:
          ${_ ? JSON.stringify(JSON.parse(h)) : h}
          `));
        } else
          i(h.length === 0 ? null : h);
      } catch (m) {
        s(m);
      }
    });
  }
  async downloadToBuffer(t, r) {
    return await r.cancellationToken.createPromise((n, i, s) => {
      const o = [], a = {
        headers: r.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      mo(t, a), Gn(a), this.doDownload(a, {
        destination: null,
        options: r,
        onCancel: s,
        callback: (l) => {
          l == null ? n(Buffer.concat(o)) : i(l);
        },
        responseHandler: (l, f) => {
          let c = 0;
          l.on("data", (u) => {
            if (c += u.length, c > 524288e3) {
              f(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            o.push(u);
          }), l.on("end", () => {
            f(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, r, n) {
    const i = this.createRequest(t, (s) => {
      if (s.statusCode >= 400) {
        r.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${s.statusCode}: ${s.statusMessage}`));
        return;
      }
      s.on("error", r.callback);
      const o = or(s, "location");
      if (o != null) {
        n < this.maxRedirects ? this.doDownload(qn.prepareRedirectUrlOptions(o, t), r, n++) : r.callback(this.createMaxRedirectError());
        return;
      }
      r.responseHandler == null ? Pg(r, s) : r.responseHandler(s, r.callback);
    });
    this.addErrorAndTimeoutHandlers(i, r.callback, t.timeout), this.addRedirectHandlers(i, t, r.callback, n, (s) => {
      this.doDownload(s, r, n++);
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
    const n = Au(t, { ...r }), i = n.headers;
    if (i != null && i.authorization) {
      const s = new Su.URL(t);
      (s.hostname.endsWith(".amazonaws.com") || s.searchParams.has("X-Amz-Credential")) && delete i.authorization;
    }
    return n;
  }
  static retryOnServerError(t, r = 3) {
    for (let n = 0; ; n++)
      try {
        return t();
      } catch (i) {
        if (n < r && (i instanceof po && i.isServerError() || i.code === "EPIPE"))
          continue;
        throw i;
      }
  }
}
Ie.HttpExecutor = qn;
function Au(e, t) {
  const r = Gn(t);
  return mo(new Su.URL(e), r), r;
}
function mo(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class Hs extends Cg.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, r = "sha512", n = "base64") {
    super(), this.expected = t, this.algorithm = r, this.encoding = n, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, Ag.createHash)(r);
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
      throw (0, Ia.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, Ia.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
Ie.DigestTransform = Hs;
function Dg(e, t, r) {
  return e != null && t != null && e !== t ? (r(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function or(e, t) {
  const r = e.headers[t];
  return r == null ? null : Array.isArray(r) ? r.length === 0 ? null : r[r.length - 1] : r;
}
function Pg(e, t) {
  if (!Dg(or(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const r = [];
  if (e.options.onProgress != null) {
    const o = or(t, "content-length");
    o != null && r.push(new Ig.ProgressCallbackTransform(parseInt(o, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const n = e.options.sha512;
  n != null ? r.push(new Hs(n, "sha512", n.length === 128 && !n.includes("+") && !n.includes("Z") && !n.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && r.push(new Hs(e.options.sha2, "sha256", "hex"));
  const i = (0, Og.createWriteStream)(e.destination);
  r.push(i);
  let s = t;
  for (const o of r)
    o.on("error", (a) => {
      i.close(), e.options.cancellationToken.cancelled || e.callback(a);
    }), s = s.pipe(o);
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
var si = {};
Object.defineProperty(si, "__esModule", { value: !0 });
si.MemoLazy = void 0;
class Fg {
  constructor(t, r) {
    this.selector = t, this.creator = r, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && bu(this.selected, t))
      return this._value;
    this.selected = t;
    const r = this.creator(t);
    return this.value = r, r;
  }
  set value(t) {
    this._value = t;
  }
}
si.MemoLazy = Fg;
function bu(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), s = Object.keys(t);
    return i.length === s.length && i.every((o) => bu(e[o], t[o]));
  }
  return e === t;
}
var oi = {};
Object.defineProperty(oi, "__esModule", { value: !0 });
oi.githubUrl = Lg;
oi.getS3LikeProviderBaseUrl = xg;
function Lg(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function xg(e) {
  const t = e.provider;
  if (t === "s3")
    return Ug(e);
  if (t === "spaces")
    return kg(e);
  throw new Error(`Not supported provider: ${t}`);
}
function Ug(e) {
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
  return Ou(t, e.path);
}
function Ou(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function kg(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return Ou(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var go = {};
Object.defineProperty(go, "__esModule", { value: !0 });
go.retry = Cu;
const Mg = wt;
async function Cu(e, t, r, n = 0, i = 0, s) {
  var o;
  const a = new Mg.CancellationToken();
  try {
    return await e();
  } catch (l) {
    if ((!((o = s == null ? void 0 : s(l)) !== null && o !== void 0) || o) && t > 0 && !a.cancelled)
      return await new Promise((f) => setTimeout(f, r + n * i)), await Cu(e, t - 1, r, n, i + 1, s);
    throw l;
  }
}
var Eo = {};
Object.defineProperty(Eo, "__esModule", { value: !0 });
Eo.parseDn = jg;
function jg(e) {
  let t = !1, r = null, n = "", i = 0;
  e = e.trim();
  const s = /* @__PURE__ */ new Map();
  for (let o = 0; o <= e.length; o++) {
    if (o === e.length) {
      r !== null && s.set(r, n);
      break;
    }
    const a = e[o];
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
        o++;
        const l = parseInt(e.slice(o, o + 2), 16);
        Number.isNaN(l) ? n += e[o] : (o++, n += String.fromCharCode(l));
        continue;
      }
      if (r === null && a === "=") {
        r = n, n = "";
        continue;
      }
      if (a === "," || a === ";" || a === "+") {
        r !== null && s.set(r, n), r = null, n = "";
        continue;
      }
    }
    if (a === " " && !t) {
      if (n.length === 0)
        continue;
      if (o > i) {
        let l = o;
        for (; e[l] === " "; )
          l++;
        i = l;
      }
      if (i >= e.length || e[i] === "," || e[i] === ";" || r === null && e[i] === "=" || r !== null && e[i] === "+") {
        o = i - 1;
        continue;
      }
    }
    n += a;
  }
  return s;
}
var cr = {};
Object.defineProperty(cr, "__esModule", { value: !0 });
cr.nil = cr.UUID = void 0;
const Ru = fr, Iu = pr, Bg = "options.name must be either a string or a Buffer", Na = (0, Ru.randomBytes)(16);
Na[0] = Na[0] | 1;
const Un = {}, J = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  Un[t] = e, J[e] = t;
}
class jt {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const r = jt.check(t);
    if (!r)
      throw new Error("not a UUID");
    this.version = r.version, r.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, r) {
    return Hg(t, "sha1", 80, r);
  }
  toString() {
    return this.ascii == null && (this.ascii = qg(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, r = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: (Un[t[14] + t[15]] & 240) >> 4,
        variant: $a((Un[t[19] + t[20]] & 224) >> 5),
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
        variant: $a((t[r + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, Iu.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
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
cr.UUID = jt;
jt.OID = jt.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function $a(e) {
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
var $r;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})($r || ($r = {}));
function Hg(e, t, r, n, i = $r.ASCII) {
  const s = (0, Ru.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, Iu.newError)(Bg, "ERR_INVALID_UUID_NAME");
  s.update(n), s.update(e);
  const a = s.digest();
  let l;
  switch (i) {
    case $r.BINARY:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = a;
      break;
    case $r.OBJECT:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = new jt(a);
      break;
    default:
      l = J[a[0]] + J[a[1]] + J[a[2]] + J[a[3]] + "-" + J[a[4]] + J[a[5]] + "-" + J[a[6] & 15 | r] + J[a[7]] + "-" + J[a[8] & 63 | 128] + J[a[9]] + "-" + J[a[10]] + J[a[11]] + J[a[12]] + J[a[13]] + J[a[14]] + J[a[15]];
      break;
  }
  return l;
}
function qg(e) {
  return J[e[0]] + J[e[1]] + J[e[2]] + J[e[3]] + "-" + J[e[4]] + J[e[5]] + "-" + J[e[6]] + J[e[7]] + "-" + J[e[8]] + J[e[9]] + "-" + J[e[10]] + J[e[11]] + J[e[12]] + J[e[13]] + J[e[14]] + J[e[15]];
}
cr.nil = new jt("00000000-0000-0000-0000-000000000000");
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
      s(b), b.q = b.c = "", b.bufferCheckPosition = t.MAX_BUFFER_LENGTH, b.opt = d || {}, b.opt.lowercase = b.opt.lowercase || b.opt.lowercasetags, b.looseCase = b.opt.lowercase ? "toLowerCase" : "toUpperCase", b.tags = [], b.closed = b.closedRoot = b.sawRoot = !1, b.tag = b.error = null, b.strict = !!p, b.noscript = !!(p || b.opt.noscript), b.state = E.BEGIN, b.strictEntities = b.opt.strictEntities, b.ENTITIES = b.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), b.attribList = [], b.opt.xmlns && (b.ns = Object.create(y)), b.opt.unquotedAttributeValues === void 0 && (b.opt.unquotedAttributeValues = !p), b.trackPosition = b.opt.position !== !1, b.trackPosition && (b.position = b.line = b.column = 0), q(b, "onready");
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
      for (var d = Math.max(t.MAX_BUFFER_LENGTH, 10), b = 0, T = 0, Q = r.length; T < Q; T++) {
        var se = p[r[T]].length;
        if (se > d)
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
        b = Math.max(b, se);
      }
      var le = t.MAX_BUFFER_LENGTH - b;
      p.bufferCheckPosition = le + p.position;
    }
    function s(p) {
      for (var d = 0, b = r.length; d < b; d++)
        p[r[d]] = "";
    }
    function o(p) {
      ee(p), p.cdata !== "" && (M(p, "oncdata", p.cdata), p.cdata = ""), p.script !== "" && (M(p, "onscript", p.script), p.script = "");
    }
    n.prototype = {
      end: function() {
        $(this);
      },
      write: Ke,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        o(this);
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
          set: function(Q) {
            if (!Q)
              return b.removeAllListeners(T), b._parser["on" + T] = Q, Q;
            b.on(T, Q);
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
          var d = lh.StringDecoder;
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
    var u = "[CDATA[", h = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", _ = "http://www.w3.org/2000/xmlns/", y = { xml: m, xmlns: _ }, w = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, S = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, A = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, D = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
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
    function ue(p, d) {
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
    function N(p, d) {
      var b = p.indexOf(":"), T = b < 0 ? ["", p] : p.split(":"), Q = T[0], se = T[1];
      return d && p === "xmlns" && (Q = "xmlns", se = ""), { prefix: Q, local: se };
    }
    function k(p) {
      if (p.strict || (p.attribName = p.attribName[p.looseCase]()), p.attribList.indexOf(p.attribName) !== -1 || p.tag.attributes.hasOwnProperty(p.attribName)) {
        p.attribName = p.attribValue = "";
        return;
      }
      if (p.opt.xmlns) {
        var d = N(p.attribName, !0), b = d.prefix, T = d.local;
        if (b === "xmlns")
          if (T === "xml" && p.attribValue !== m)
            O(
              p,
              "xml: prefix must be bound to " + m + `
Actual: ` + p.attribValue
            );
          else if (T === "xmlns" && p.attribValue !== _)
            O(
              p,
              "xmlns: prefix must be bound to " + _ + `
Actual: ` + p.attribValue
            );
          else {
            var Q = p.tag, se = p.tags[p.tags.length - 1] || p;
            Q.ns === se.ns && (Q.ns = Object.create(se.ns)), Q.ns[T] = p.attribValue;
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
        var b = p.tag, T = N(p.tagName);
        b.prefix = T.prefix, b.local = T.local, b.uri = b.ns[T.prefix] || "", b.prefix && !b.uri && (O(p, "Unbound namespace prefix: " + JSON.stringify(p.tagName)), b.uri = T.prefix);
        var Q = p.tags[p.tags.length - 1] || p;
        b.ns && Q.ns !== b.ns && Object.keys(b.ns).forEach(function(cn) {
          M(p, "onopennamespace", {
            prefix: cn,
            uri: b.ns[cn]
          });
        });
        for (var se = 0, le = p.attribList.length; se < le; se++) {
          var ve = p.attribList[se], Se = ve[0], lt = ve[1], de = N(Se, !0), Ge = de.prefix, Ai = de.local, ln = Ge === "" ? "" : b.ns[Ge] || "", Er = {
            name: Se,
            value: lt,
            prefix: Ge,
            local: Ai,
            uri: ln
          };
          Ge && Ge !== "xmlns" && !ln && (O(p, "Unbound namespace prefix: " + JSON.stringify(Ge)), Er.uri = Ge), p.tag.attributes[Se] = Er, M(p, "onattribute", Er);
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
        var Q = p.tags[d];
        if (Q.name !== T)
          O(p, "Unexpected close tag");
        else
          break;
      }
      if (d < 0) {
        O(p, "Unmatched closing tag: " + p.tagName), p.textNode += "</" + p.tagName + ">", p.state = E.TEXT;
        return;
      }
      p.tagName = b;
      for (var se = p.tags.length; se-- > d; ) {
        var le = p.tag = p.tags.pop();
        p.tagName = p.tag.name, M(p, "onclosetag", p.tagName);
        var ve = {};
        for (var Se in le.ns)
          ve[Se] = le.ns[Se];
        var lt = p.tags[p.tags.length - 1] || p;
        p.opt.xmlns && le.ns !== lt.ns && Object.keys(le.ns).forEach(function(de) {
          var Ge = le.ns[de];
          M(p, "onclosenamespace", { prefix: de, uri: Ge });
        });
      }
      d === 0 && (p.closedRoot = !0), p.tagName = p.attribValue = p.attribName = "", p.attribList.length = 0, p.state = E.TEXT;
    }
    function te(p) {
      var d = p.entity, b = d.toLowerCase(), T, Q = "";
      return p.ENTITIES[d] ? p.ENTITIES[d] : p.ENTITIES[b] ? p.ENTITIES[b] : (d = b, d.charAt(0) === "#" && (d.charAt(1) === "x" ? (d = d.slice(2), T = parseInt(d, 16), Q = T.toString(16)) : (d = d.slice(1), T = parseInt(d, 10), Q = T.toString(10))), d = d.replace(/^0+/, ""), isNaN(T) || Q.toLowerCase() !== d ? (O(p, "Invalid character entity"), "&" + p.entity + ";") : String.fromCodePoint(T));
    }
    function me(p, d) {
      d === "<" ? (p.state = E.OPEN_WAKA, p.startTagPosition = p.position) : L(d) || (O(p, "Non-whitespace before first tag."), p.textNode = d, p.state = E.TEXT);
    }
    function U(p, d) {
      var b = "";
      return d < p.length && (b = p.charAt(d)), b;
    }
    function Ke(p) {
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
            me(d, T);
            continue;
          case E.BEGIN_WHITESPACE:
            me(d, T);
            continue;
          case E.TEXT:
            if (d.sawRoot && !d.closedRoot) {
              for (var Q = b - 1; T && T !== "<" && T !== "&"; )
                T = U(p, b++), T && d.trackPosition && (d.position++, T === `
` ? (d.line++, d.column = 0) : d.column++);
              d.textNode += p.substring(Q, b - 1);
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
            else if (!L(T)) if (j(w, T))
              d.state = E.OPEN_TAG, d.tagName = T;
            else if (T === "/")
              d.state = E.CLOSE_TAG, d.tagName = "";
            else if (T === "?")
              d.state = E.PROC_INST, d.procInstName = d.procInstBody = "";
            else {
              if (O(d, "Unencoded <"), d.startTagPosition + 1 < d.position) {
                var se = d.position - d.startTagPosition;
                T = new Array(se).join(" ") + T;
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
            ), d.doctype = "", d.sgmlDecl = "") : T === ">" ? (M(d, "onsgmldeclaration", d.sgmlDecl), d.sgmlDecl = "", d.state = E.TEXT) : (B(T) && (d.state = E.SGML_DECL_QUOTED), d.sgmlDecl += T);
            continue;
          case E.SGML_DECL_QUOTED:
            T === d.q && (d.state = E.SGML_DECL, d.q = ""), d.sgmlDecl += T;
            continue;
          case E.DOCTYPE:
            T === ">" ? (d.state = E.TEXT, M(d, "ondoctype", d.doctype), d.doctype = !0) : (d.doctype += T, T === "[" ? d.state = E.DOCTYPE_DTD : B(T) && (d.state = E.DOCTYPE_QUOTED, d.q = T));
            continue;
          case E.DOCTYPE_QUOTED:
            d.doctype += T, T === d.q && (d.q = "", d.state = E.DOCTYPE);
            continue;
          case E.DOCTYPE_DTD:
            T === "]" ? (d.doctype += T, d.state = E.DOCTYPE) : T === "<" ? (d.state = E.OPEN_WAKA, d.startTagPosition = d.position) : B(T) ? (d.doctype += T, d.state = E.DOCTYPE_DTD_QUOTED, d.q = T) : d.doctype += T;
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
            j(S, T) ? d.tagName += T : (P(d), T === ">" ? z(d) : T === "/" ? d.state = E.OPEN_TAG_SLASH : (L(T) || O(d, "Invalid character in tag name"), d.state = E.ATTRIB));
            continue;
          case E.OPEN_TAG_SLASH:
            T === ">" ? (z(d, !0), G(d)) : (O(d, "Forward-slash in opening tag not followed by >"), d.state = E.ATTRIB);
            continue;
          case E.ATTRIB:
            if (L(T))
              continue;
            T === ">" ? z(d) : T === "/" ? d.state = E.OPEN_TAG_SLASH : j(w, T) ? (d.attribName = T, d.attribValue = "", d.state = E.ATTRIB_NAME) : O(d, "Invalid attribute name");
            continue;
          case E.ATTRIB_NAME:
            T === "=" ? d.state = E.ATTRIB_VALUE : T === ">" ? (O(d, "Attribute without value"), d.attribValue = d.attribName, k(d), z(d)) : L(T) ? d.state = E.ATTRIB_NAME_SAW_WHITE : j(S, T) ? d.attribName += T : O(d, "Invalid attribute name");
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
              }), d.attribName = "", T === ">" ? z(d) : j(w, T) ? (d.attribName = T, d.state = E.ATTRIB_NAME) : (O(d, "Invalid attribute name"), d.state = E.ATTRIB);
            }
            continue;
          case E.ATTRIB_VALUE:
            if (L(T))
              continue;
            B(T) ? (d.q = T, d.state = E.ATTRIB_VALUE_QUOTED) : (d.opt.unquotedAttributeValues || C(d, "Unquoted attribute value"), d.state = E.ATTRIB_VALUE_UNQUOTED, d.attribValue = T);
            continue;
          case E.ATTRIB_VALUE_QUOTED:
            if (T !== d.q) {
              T === "&" ? d.state = E.ATTRIB_VALUE_ENTITY_Q : d.attribValue += T;
              continue;
            }
            k(d), d.q = "", d.state = E.ATTRIB_VALUE_CLOSED;
            continue;
          case E.ATTRIB_VALUE_CLOSED:
            L(T) ? d.state = E.ATTRIB : T === ">" ? z(d) : T === "/" ? d.state = E.OPEN_TAG_SLASH : j(w, T) ? (O(d, "No whitespace between attributes"), d.attribName = T, d.attribValue = "", d.state = E.ATTRIB_NAME) : O(d, "Invalid attribute name");
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
              T === ">" ? G(d) : j(S, T) ? d.tagName += T : d.script ? (d.script += "</" + d.tagName, d.tagName = "", d.state = E.SCRIPT) : (L(T) || O(d, "Invalid tagname in closing tag"), d.state = E.CLOSE_TAG_SAW_WHITE);
            else {
              if (L(T))
                continue;
              ue(w, T) ? d.script ? (d.script += "</" + T, d.state = E.SCRIPT) : O(d, "Invalid tagname in closing tag.") : d.tagName = T;
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
            var le, ve;
            switch (d.state) {
              case E.TEXT_ENTITY:
                le = E.TEXT, ve = "textNode";
                break;
              case E.ATTRIB_VALUE_ENTITY_Q:
                le = E.ATTRIB_VALUE_QUOTED, ve = "attribValue";
                break;
              case E.ATTRIB_VALUE_ENTITY_U:
                le = E.ATTRIB_VALUE_UNQUOTED, ve = "attribValue";
                break;
            }
            if (T === ";") {
              var Se = te(d);
              d.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(Se) ? (d.entity = "", d.state = le, d.write(Se)) : (d[ve] += Se, d.entity = "", d.state = le);
            } else j(d.entity.length ? D : A, T) ? d.entity += T : (O(d, "Invalid character in entity name"), d[ve] += "&" + d.entity + T, d.entity = "", d.state = le);
            continue;
          default:
            throw new Error(d, "Unknown state: " + d.state);
        }
      return d.position >= d.bufferCheckPosition && i(d), d;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var p = String.fromCharCode, d = Math.floor, b = function() {
        var T = 16384, Q = [], se, le, ve = -1, Se = arguments.length;
        if (!Se)
          return "";
        for (var lt = ""; ++ve < Se; ) {
          var de = Number(arguments[ve]);
          if (!isFinite(de) || // `NaN`, `+Infinity`, or `-Infinity`
          de < 0 || // not a valid Unicode code point
          de > 1114111 || // not a valid Unicode code point
          d(de) !== de)
            throw RangeError("Invalid code point: " + de);
          de <= 65535 ? Q.push(de) : (de -= 65536, se = (de >> 10) + 55296, le = de % 1024 + 56320, Q.push(se, le)), (ve + 1 === Se || Q.length > T) && (lt += p.apply(null, Q), Q.length = 0);
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
Zr.parseXml = Yg;
const Gg = Nu, Sn = pr;
class $u {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, Sn.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!Wg(t))
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
      if (Da(n, t, r))
        return n;
    return null;
  }
  getElements(t, r = !1) {
    return this.elements === null ? [] : this.elements.filter((n) => Da(n, t, r));
  }
  elementValueOrEmpty(t, r = !1) {
    const n = this.elementOrNull(t, r);
    return n === null ? "" : n.value;
  }
}
Zr.XElement = $u;
const Vg = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function Wg(e) {
  return Vg.test(e);
}
function Da(e, t, r) {
  const n = e.name;
  return n === t || r === !0 && n.length === t.length && n.toLowerCase() === t.toLowerCase();
}
function Yg(e) {
  let t = null;
  const r = Gg.parser(!0, {}), n = [];
  return r.onopentag = (i) => {
    const s = new $u(i.name);
    if (s.attributes = i.attributes, t === null)
      t = s;
    else {
      const o = n[n.length - 1];
      o.elements == null && (o.elements = []), o.elements.push(s);
    }
    n.push(s);
  }, r.onclosetag = () => {
    n.pop();
  }, r.ontext = (i) => {
    n.length > 0 && (n[n.length - 1].value = i);
  }, r.oncdata = (i) => {
    const s = n[n.length - 1];
    s.value = i, s.isCData = !0;
  }, r.onerror = (i) => {
    throw i;
  }, r.write(e), t;
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = u;
  var t = wt;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var r = pr;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return r.newError;
  } });
  var n = Ie;
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
  var i = si;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var s = Qr;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return s.ProgressCallbackTransform;
  } });
  var o = oi;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return o.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return o.githubUrl;
  } });
  var a = go;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return a.retry;
  } });
  var l = Eo;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return l.parseDn;
  } });
  var f = cr;
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
})(ye);
var Te = {}, yo = {}, Ye = {};
function Du(e) {
  return typeof e > "u" || e === null;
}
function zg(e) {
  return typeof e == "object" && e !== null;
}
function Xg(e) {
  return Array.isArray(e) ? e : Du(e) ? [] : [e];
}
function Kg(e, t) {
  var r, n, i, s;
  if (t)
    for (s = Object.keys(t), r = 0, n = s.length; r < n; r += 1)
      i = s[r], e[i] = t[i];
  return e;
}
function Jg(e, t) {
  var r = "", n;
  for (n = 0; n < t; n += 1)
    r += e;
  return r;
}
function Qg(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Ye.isNothing = Du;
Ye.isObject = zg;
Ye.toArray = Xg;
Ye.repeat = Jg;
Ye.isNegativeZero = Qg;
Ye.extend = Kg;
function Pu(e, t) {
  var r = "", n = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (r += 'in "' + e.mark.name + '" '), r += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (r += `

` + e.mark.snippet), n + " " + r) : n;
}
function kr(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = Pu(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
kr.prototype = Object.create(Error.prototype);
kr.prototype.constructor = kr;
kr.prototype.toString = function(t) {
  return this.name + ": " + Pu(this, t);
};
var en = kr, Cr = Ye;
function ji(e, t, r, n, i) {
  var s = "", o = "", a = Math.floor(i / 2) - 1;
  return n - t > a && (s = " ... ", t = n - a + s.length), r - n > a && (o = " ...", r = n + a - o.length), {
    str: s + e.slice(t, r).replace(/\t/g, "→") + o,
    pos: n - t + s.length
    // relative position
  };
}
function Bi(e, t) {
  return Cr.repeat(" ", t - e.length) + e;
}
function Zg(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], i = [], s, o = -1; s = r.exec(e.buffer); )
    i.push(s.index), n.push(s.index + s[0].length), e.position <= s.index && o < 0 && (o = n.length - 2);
  o < 0 && (o = n.length - 1);
  var a = "", l, f, c = Math.min(e.line + t.linesAfter, i.length).toString().length, u = t.maxLength - (t.indent + c + 3);
  for (l = 1; l <= t.linesBefore && !(o - l < 0); l++)
    f = ji(
      e.buffer,
      n[o - l],
      i[o - l],
      e.position - (n[o] - n[o - l]),
      u
    ), a = Cr.repeat(" ", t.indent) + Bi((e.line - l + 1).toString(), c) + " | " + f.str + `
` + a;
  for (f = ji(e.buffer, n[o], i[o], e.position, u), a += Cr.repeat(" ", t.indent) + Bi((e.line + 1).toString(), c) + " | " + f.str + `
`, a += Cr.repeat("-", t.indent + c + 3 + f.pos) + `^
`, l = 1; l <= t.linesAfter && !(o + l >= i.length); l++)
    f = ji(
      e.buffer,
      n[o + l],
      i[o + l],
      e.position - (n[o] - n[o + l]),
      u
    ), a += Cr.repeat(" ", t.indent) + Bi((e.line + l + 1).toString(), c) + " | " + f.str + `
`;
  return a.replace(/\n$/, "");
}
var e0 = Zg, Pa = en, t0 = [
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
], r0 = [
  "scalar",
  "sequence",
  "mapping"
];
function n0(e) {
  var t = {};
  return e !== null && Object.keys(e).forEach(function(r) {
    e[r].forEach(function(n) {
      t[String(n)] = r;
    });
  }), t;
}
function i0(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(r) {
    if (t0.indexOf(r) === -1)
      throw new Pa('Unknown option "' + r + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(r) {
    return r;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = n0(t.styleAliases || null), r0.indexOf(this.kind) === -1)
    throw new Pa('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var Fe = i0, Sr = en, Hi = Fe;
function Fa(e, t) {
  var r = [];
  return e[t].forEach(function(n) {
    var i = r.length;
    r.forEach(function(s, o) {
      s.tag === n.tag && s.kind === n.kind && s.multi === n.multi && (i = o);
    }), r[i] = n;
  }), r;
}
function s0() {
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
function qs(e) {
  return this.extend(e);
}
qs.prototype.extend = function(t) {
  var r = [], n = [];
  if (t instanceof Hi)
    n.push(t);
  else if (Array.isArray(t))
    n = n.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (r = r.concat(t.implicit)), t.explicit && (n = n.concat(t.explicit));
  else
    throw new Sr("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(s) {
    if (!(s instanceof Hi))
      throw new Sr("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (s.loadKind && s.loadKind !== "scalar")
      throw new Sr("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (s.multi)
      throw new Sr("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(s) {
    if (!(s instanceof Hi))
      throw new Sr("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var i = Object.create(qs.prototype);
  return i.implicit = (this.implicit || []).concat(r), i.explicit = (this.explicit || []).concat(n), i.compiledImplicit = Fa(i, "implicit"), i.compiledExplicit = Fa(i, "explicit"), i.compiledTypeMap = s0(i.compiledImplicit, i.compiledExplicit), i;
};
var Fu = qs, o0 = Fe, Lu = new o0("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), a0 = Fe, xu = new a0("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), l0 = Fe, Uu = new l0("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), c0 = Fu, ku = new c0({
  explicit: [
    Lu,
    xu,
    Uu
  ]
}), u0 = Fe;
function f0(e) {
  if (e === null) return !0;
  var t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function d0() {
  return null;
}
function h0(e) {
  return e === null;
}
var Mu = new u0("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: f0,
  construct: d0,
  predicate: h0,
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
}), p0 = Fe;
function m0(e) {
  if (e === null) return !1;
  var t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function g0(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function E0(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var ju = new p0("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: m0,
  construct: g0,
  predicate: E0,
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
}), y0 = Ye, v0 = Fe;
function _0(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function w0(e) {
  return 48 <= e && e <= 55;
}
function T0(e) {
  return 48 <= e && e <= 57;
}
function S0(e) {
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
          if (!_0(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "o") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!w0(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
  }
  if (i === "_") return !1;
  for (; r < t; r++)
    if (i = e[r], i !== "_") {
      if (!T0(e.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || i === "_");
}
function A0(e) {
  var t = e, r = 1, n;
  if (t.indexOf("_") !== -1 && (t = t.replace(/_/g, "")), n = t[0], (n === "-" || n === "+") && (n === "-" && (r = -1), t = t.slice(1), n = t[0]), t === "0") return 0;
  if (n === "0") {
    if (t[1] === "b") return r * parseInt(t.slice(2), 2);
    if (t[1] === "x") return r * parseInt(t.slice(2), 16);
    if (t[1] === "o") return r * parseInt(t.slice(2), 8);
  }
  return r * parseInt(t, 10);
}
function b0(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !y0.isNegativeZero(e);
}
var Bu = new v0("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: S0,
  construct: A0,
  predicate: b0,
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
}), Hu = Ye, O0 = Fe, C0 = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function R0(e) {
  return !(e === null || !C0.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function I0(e) {
  var t, r;
  return t = e.replace(/_/g, "").toLowerCase(), r = t[0] === "-" ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : r * parseFloat(t, 10);
}
var N0 = /^[-+]?[0-9]+e/;
function $0(e, t) {
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
  else if (Hu.isNegativeZero(e))
    return "-0.0";
  return r = e.toString(10), N0.test(r) ? r.replace("e", ".e") : r;
}
function D0(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || Hu.isNegativeZero(e));
}
var qu = new O0("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: R0,
  construct: I0,
  predicate: D0,
  represent: $0,
  defaultStyle: "lowercase"
}), Gu = ku.extend({
  implicit: [
    Mu,
    ju,
    Bu,
    qu
  ]
}), Vu = Gu, P0 = Fe, Wu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), Yu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function F0(e) {
  return e === null ? !1 : Wu.exec(e) !== null || Yu.exec(e) !== null;
}
function L0(e) {
  var t, r, n, i, s, o, a, l = 0, f = null, c, u, h;
  if (t = Wu.exec(e), t === null && (t = Yu.exec(e)), t === null) throw new Error("Date resolve error");
  if (r = +t[1], n = +t[2] - 1, i = +t[3], !t[4])
    return new Date(Date.UTC(r, n, i));
  if (s = +t[4], o = +t[5], a = +t[6], t[7]) {
    for (l = t[7].slice(0, 3); l.length < 3; )
      l += "0";
    l = +l;
  }
  return t[9] && (c = +t[10], u = +(t[11] || 0), f = (c * 60 + u) * 6e4, t[9] === "-" && (f = -f)), h = new Date(Date.UTC(r, n, i, s, o, a, l)), f && h.setTime(h.getTime() - f), h;
}
function x0(e) {
  return e.toISOString();
}
var zu = new P0("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: F0,
  construct: L0,
  instanceOf: Date,
  represent: x0
}), U0 = Fe;
function k0(e) {
  return e === "<<" || e === null;
}
var Xu = new U0("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: k0
}), M0 = Fe, vo = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function j0(e) {
  if (e === null) return !1;
  var t, r, n = 0, i = e.length, s = vo;
  for (r = 0; r < i; r++)
    if (t = s.indexOf(e.charAt(r)), !(t > 64)) {
      if (t < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function B0(e) {
  var t, r, n = e.replace(/[\r\n=]/g, ""), i = n.length, s = vo, o = 0, a = [];
  for (t = 0; t < i; t++)
    t % 4 === 0 && t && (a.push(o >> 16 & 255), a.push(o >> 8 & 255), a.push(o & 255)), o = o << 6 | s.indexOf(n.charAt(t));
  return r = i % 4 * 6, r === 0 ? (a.push(o >> 16 & 255), a.push(o >> 8 & 255), a.push(o & 255)) : r === 18 ? (a.push(o >> 10 & 255), a.push(o >> 2 & 255)) : r === 12 && a.push(o >> 4 & 255), new Uint8Array(a);
}
function H0(e) {
  var t = "", r = 0, n, i, s = e.length, o = vo;
  for (n = 0; n < s; n++)
    n % 3 === 0 && n && (t += o[r >> 18 & 63], t += o[r >> 12 & 63], t += o[r >> 6 & 63], t += o[r & 63]), r = (r << 8) + e[n];
  return i = s % 3, i === 0 ? (t += o[r >> 18 & 63], t += o[r >> 12 & 63], t += o[r >> 6 & 63], t += o[r & 63]) : i === 2 ? (t += o[r >> 10 & 63], t += o[r >> 4 & 63], t += o[r << 2 & 63], t += o[64]) : i === 1 && (t += o[r >> 2 & 63], t += o[r << 4 & 63], t += o[64], t += o[64]), t;
}
function q0(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var Ku = new M0("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: j0,
  construct: B0,
  predicate: q0,
  represent: H0
}), G0 = Fe, V0 = Object.prototype.hasOwnProperty, W0 = Object.prototype.toString;
function Y0(e) {
  if (e === null) return !0;
  var t = [], r, n, i, s, o, a = e;
  for (r = 0, n = a.length; r < n; r += 1) {
    if (i = a[r], o = !1, W0.call(i) !== "[object Object]") return !1;
    for (s in i)
      if (V0.call(i, s))
        if (!o) o = !0;
        else return !1;
    if (!o) return !1;
    if (t.indexOf(s) === -1) t.push(s);
    else return !1;
  }
  return !0;
}
function z0(e) {
  return e !== null ? e : [];
}
var Ju = new G0("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: Y0,
  construct: z0
}), X0 = Fe, K0 = Object.prototype.toString;
function J0(e) {
  if (e === null) return !0;
  var t, r, n, i, s, o = e;
  for (s = new Array(o.length), t = 0, r = o.length; t < r; t += 1) {
    if (n = o[t], K0.call(n) !== "[object Object]" || (i = Object.keys(n), i.length !== 1)) return !1;
    s[t] = [i[0], n[i[0]]];
  }
  return !0;
}
function Q0(e) {
  if (e === null) return [];
  var t, r, n, i, s, o = e;
  for (s = new Array(o.length), t = 0, r = o.length; t < r; t += 1)
    n = o[t], i = Object.keys(n), s[t] = [i[0], n[i[0]]];
  return s;
}
var Qu = new X0("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: J0,
  construct: Q0
}), Z0 = Fe, eE = Object.prototype.hasOwnProperty;
function tE(e) {
  if (e === null) return !0;
  var t, r = e;
  for (t in r)
    if (eE.call(r, t) && r[t] !== null)
      return !1;
  return !0;
}
function rE(e) {
  return e !== null ? e : {};
}
var Zu = new Z0("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: tE,
  construct: rE
}), _o = Vu.extend({
  implicit: [
    zu,
    Xu
  ],
  explicit: [
    Ku,
    Ju,
    Qu,
    Zu
  ]
}), Lt = Ye, ef = en, nE = e0, iE = _o, Tt = Object.prototype.hasOwnProperty, Wn = 1, tf = 2, rf = 3, Yn = 4, qi = 1, sE = 2, La = 3, oE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, aE = /[\x85\u2028\u2029]/, lE = /[,\[\]\{\}]/, nf = /^(?:!|!!|![a-z\-]+!)$/i, sf = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function xa(e) {
  return Object.prototype.toString.call(e);
}
function Ze(e) {
  return e === 10 || e === 13;
}
function kt(e) {
  return e === 9 || e === 32;
}
function ke(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function er(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function cE(e) {
  var t;
  return 48 <= e && e <= 57 ? e - 48 : (t = e | 32, 97 <= t && t <= 102 ? t - 97 + 10 : -1);
}
function uE(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function fE(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function Ua(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function dE(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
var of = new Array(256), af = new Array(256);
for (var Yt = 0; Yt < 256; Yt++)
  of[Yt] = Ua(Yt) ? 1 : 0, af[Yt] = Ua(Yt);
function hE(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || iE, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function lf(e, t) {
  var r = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return r.snippet = nE(r), new ef(t, r);
}
function x(e, t) {
  throw lf(e, t);
}
function zn(e, t) {
  e.onWarning && e.onWarning.call(null, lf(e, t));
}
var ka = {
  YAML: function(t, r, n) {
    var i, s, o;
    t.version !== null && x(t, "duplication of %YAML directive"), n.length !== 1 && x(t, "YAML directive accepts exactly one argument"), i = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), i === null && x(t, "ill-formed argument of the YAML directive"), s = parseInt(i[1], 10), o = parseInt(i[2], 10), s !== 1 && x(t, "unacceptable YAML version of the document"), t.version = n[0], t.checkLineBreaks = o < 2, o !== 1 && o !== 2 && zn(t, "unsupported YAML version of the document");
  },
  TAG: function(t, r, n) {
    var i, s;
    n.length !== 2 && x(t, "TAG directive accepts exactly two arguments"), i = n[0], s = n[1], nf.test(i) || x(t, "ill-formed tag handle (first argument) of the TAG directive"), Tt.call(t.tagMap, i) && x(t, 'there is a previously declared suffix for "' + i + '" tag handle'), sf.test(s) || x(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      s = decodeURIComponent(s);
    } catch {
      x(t, "tag prefix is malformed: " + s);
    }
    t.tagMap[i] = s;
  }
};
function Et(e, t, r, n) {
  var i, s, o, a;
  if (t < r) {
    if (a = e.input.slice(t, r), n)
      for (i = 0, s = a.length; i < s; i += 1)
        o = a.charCodeAt(i), o === 9 || 32 <= o && o <= 1114111 || x(e, "expected valid JSON character");
    else oE.test(a) && x(e, "the stream contains non-printable characters");
    e.result += a;
  }
}
function Ma(e, t, r, n) {
  var i, s, o, a;
  for (Lt.isObject(r) || x(e, "cannot merge mappings; the provided source object is unacceptable"), i = Object.keys(r), o = 0, a = i.length; o < a; o += 1)
    s = i[o], Tt.call(t, s) || (t[s] = r[s], n[s] = !0);
}
function tr(e, t, r, n, i, s, o, a, l) {
  var f, c;
  if (Array.isArray(i))
    for (i = Array.prototype.slice.call(i), f = 0, c = i.length; f < c; f += 1)
      Array.isArray(i[f]) && x(e, "nested arrays are not supported inside keys"), typeof i == "object" && xa(i[f]) === "[object Object]" && (i[f] = "[object Object]");
  if (typeof i == "object" && xa(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(s))
      for (f = 0, c = s.length; f < c; f += 1)
        Ma(e, t, s[f], r);
    else
      Ma(e, t, s, r);
  else
    !e.json && !Tt.call(r, i) && Tt.call(t, i) && (e.line = o || e.line, e.lineStart = a || e.lineStart, e.position = l || e.position, x(e, "duplicated mapping key")), i === "__proto__" ? Object.defineProperty(t, i, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: s
    }) : t[i] = s, delete r[i];
  return t;
}
function wo(e) {
  var t;
  t = e.input.charCodeAt(e.position), t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : x(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function fe(e, t, r) {
  for (var n = 0, i = e.input.charCodeAt(e.position); i !== 0; ) {
    for (; kt(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (Ze(i))
      for (wo(e), i = e.input.charCodeAt(e.position), n++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && e.lineIndent < r && zn(e, "deficient indentation"), n;
}
function ai(e) {
  var t = e.position, r;
  return r = e.input.charCodeAt(t), !!((r === 45 || r === 46) && r === e.input.charCodeAt(t + 1) && r === e.input.charCodeAt(t + 2) && (t += 3, r = e.input.charCodeAt(t), r === 0 || ke(r)));
}
function To(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += Lt.repeat(`
`, t - 1));
}
function pE(e, t, r) {
  var n, i, s, o, a, l, f, c, u = e.kind, h = e.result, m;
  if (m = e.input.charCodeAt(e.position), ke(m) || er(m) || m === 35 || m === 38 || m === 42 || m === 33 || m === 124 || m === 62 || m === 39 || m === 34 || m === 37 || m === 64 || m === 96 || (m === 63 || m === 45) && (i = e.input.charCodeAt(e.position + 1), ke(i) || r && er(i)))
    return !1;
  for (e.kind = "scalar", e.result = "", s = o = e.position, a = !1; m !== 0; ) {
    if (m === 58) {
      if (i = e.input.charCodeAt(e.position + 1), ke(i) || r && er(i))
        break;
    } else if (m === 35) {
      if (n = e.input.charCodeAt(e.position - 1), ke(n))
        break;
    } else {
      if (e.position === e.lineStart && ai(e) || r && er(m))
        break;
      if (Ze(m))
        if (l = e.line, f = e.lineStart, c = e.lineIndent, fe(e, !1, -1), e.lineIndent >= t) {
          a = !0, m = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = o, e.line = l, e.lineStart = f, e.lineIndent = c;
          break;
        }
    }
    a && (Et(e, s, o, !1), To(e, e.line - l), s = o = e.position, a = !1), kt(m) || (o = e.position + 1), m = e.input.charCodeAt(++e.position);
  }
  return Et(e, s, o, !1), e.result ? !0 : (e.kind = u, e.result = h, !1);
}
function mE(e, t) {
  var r, n, i;
  if (r = e.input.charCodeAt(e.position), r !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = i = e.position; (r = e.input.charCodeAt(e.position)) !== 0; )
    if (r === 39)
      if (Et(e, n, e.position, !0), r = e.input.charCodeAt(++e.position), r === 39)
        n = e.position, e.position++, i = e.position;
      else
        return !0;
    else Ze(r) ? (Et(e, n, i, !0), To(e, fe(e, !1, t)), n = i = e.position) : e.position === e.lineStart && ai(e) ? x(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
  x(e, "unexpected end of the stream within a single quoted scalar");
}
function gE(e, t) {
  var r, n, i, s, o, a;
  if (a = e.input.charCodeAt(e.position), a !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, r = n = e.position; (a = e.input.charCodeAt(e.position)) !== 0; ) {
    if (a === 34)
      return Et(e, r, e.position, !0), e.position++, !0;
    if (a === 92) {
      if (Et(e, r, e.position, !0), a = e.input.charCodeAt(++e.position), Ze(a))
        fe(e, !1, t);
      else if (a < 256 && of[a])
        e.result += af[a], e.position++;
      else if ((o = uE(a)) > 0) {
        for (i = o, s = 0; i > 0; i--)
          a = e.input.charCodeAt(++e.position), (o = cE(a)) >= 0 ? s = (s << 4) + o : x(e, "expected hexadecimal character");
        e.result += dE(s), e.position++;
      } else
        x(e, "unknown escape sequence");
      r = n = e.position;
    } else Ze(a) ? (Et(e, r, n, !0), To(e, fe(e, !1, t)), r = n = e.position) : e.position === e.lineStart && ai(e) ? x(e, "unexpected end of the document within a double quoted scalar") : (e.position++, n = e.position);
  }
  x(e, "unexpected end of the stream within a double quoted scalar");
}
function EE(e, t) {
  var r = !0, n, i, s, o = e.tag, a, l = e.anchor, f, c, u, h, m, _ = /* @__PURE__ */ Object.create(null), y, w, S, A;
  if (A = e.input.charCodeAt(e.position), A === 91)
    c = 93, m = !1, a = [];
  else if (A === 123)
    c = 125, m = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = a), A = e.input.charCodeAt(++e.position); A !== 0; ) {
    if (fe(e, !0, t), A = e.input.charCodeAt(e.position), A === c)
      return e.position++, e.tag = o, e.anchor = l, e.kind = m ? "mapping" : "sequence", e.result = a, !0;
    r ? A === 44 && x(e, "expected the node content, but found ','") : x(e, "missed comma between flow collection entries"), w = y = S = null, u = h = !1, A === 63 && (f = e.input.charCodeAt(e.position + 1), ke(f) && (u = h = !0, e.position++, fe(e, !0, t))), n = e.line, i = e.lineStart, s = e.position, ur(e, t, Wn, !1, !0), w = e.tag, y = e.result, fe(e, !0, t), A = e.input.charCodeAt(e.position), (h || e.line === n) && A === 58 && (u = !0, A = e.input.charCodeAt(++e.position), fe(e, !0, t), ur(e, t, Wn, !1, !0), S = e.result), m ? tr(e, a, _, w, y, S, n, i, s) : u ? a.push(tr(e, null, _, w, y, S, n, i, s)) : a.push(y), fe(e, !0, t), A = e.input.charCodeAt(e.position), A === 44 ? (r = !0, A = e.input.charCodeAt(++e.position)) : r = !1;
  }
  x(e, "unexpected end of the stream within a flow collection");
}
function yE(e, t) {
  var r, n, i = qi, s = !1, o = !1, a = t, l = 0, f = !1, c, u;
  if (u = e.input.charCodeAt(e.position), u === 124)
    n = !1;
  else if (u === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; u !== 0; )
    if (u = e.input.charCodeAt(++e.position), u === 43 || u === 45)
      qi === i ? i = u === 43 ? La : sE : x(e, "repeat of a chomping mode identifier");
    else if ((c = fE(u)) >= 0)
      c === 0 ? x(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : o ? x(e, "repeat of an indentation width identifier") : (a = t + c - 1, o = !0);
    else
      break;
  if (kt(u)) {
    do
      u = e.input.charCodeAt(++e.position);
    while (kt(u));
    if (u === 35)
      do
        u = e.input.charCodeAt(++e.position);
      while (!Ze(u) && u !== 0);
  }
  for (; u !== 0; ) {
    for (wo(e), e.lineIndent = 0, u = e.input.charCodeAt(e.position); (!o || e.lineIndent < a) && u === 32; )
      e.lineIndent++, u = e.input.charCodeAt(++e.position);
    if (!o && e.lineIndent > a && (a = e.lineIndent), Ze(u)) {
      l++;
      continue;
    }
    if (e.lineIndent < a) {
      i === La ? e.result += Lt.repeat(`
`, s ? 1 + l : l) : i === qi && s && (e.result += `
`);
      break;
    }
    for (n ? kt(u) ? (f = !0, e.result += Lt.repeat(`
`, s ? 1 + l : l)) : f ? (f = !1, e.result += Lt.repeat(`
`, l + 1)) : l === 0 ? s && (e.result += " ") : e.result += Lt.repeat(`
`, l) : e.result += Lt.repeat(`
`, s ? 1 + l : l), s = !0, o = !0, l = 0, r = e.position; !Ze(u) && u !== 0; )
      u = e.input.charCodeAt(++e.position);
    Et(e, r, e.position, !1);
  }
  return !0;
}
function ja(e, t) {
  var r, n = e.tag, i = e.anchor, s = [], o, a = !1, l;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = s), l = e.input.charCodeAt(e.position); l !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), !(l !== 45 || (o = e.input.charCodeAt(e.position + 1), !ke(o)))); ) {
    if (a = !0, e.position++, fe(e, !0, -1) && e.lineIndent <= t) {
      s.push(null), l = e.input.charCodeAt(e.position);
      continue;
    }
    if (r = e.line, ur(e, t, rf, !1, !0), s.push(e.result), fe(e, !0, -1), l = e.input.charCodeAt(e.position), (e.line === r || e.lineIndent > t) && l !== 0)
      x(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return a ? (e.tag = n, e.anchor = i, e.kind = "sequence", e.result = s, !0) : !1;
}
function vE(e, t, r) {
  var n, i, s, o, a, l, f = e.tag, c = e.anchor, u = {}, h = /* @__PURE__ */ Object.create(null), m = null, _ = null, y = null, w = !1, S = !1, A;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = u), A = e.input.charCodeAt(e.position); A !== 0; ) {
    if (!w && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, x(e, "tab characters must not be used in indentation")), n = e.input.charCodeAt(e.position + 1), s = e.line, (A === 63 || A === 58) && ke(n))
      A === 63 ? (w && (tr(e, u, h, m, _, null, o, a, l), m = _ = y = null), S = !0, w = !0, i = !0) : w ? (w = !1, i = !0) : x(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, A = n;
    else {
      if (o = e.line, a = e.lineStart, l = e.position, !ur(e, r, tf, !1, !0))
        break;
      if (e.line === s) {
        for (A = e.input.charCodeAt(e.position); kt(A); )
          A = e.input.charCodeAt(++e.position);
        if (A === 58)
          A = e.input.charCodeAt(++e.position), ke(A) || x(e, "a whitespace character is expected after the key-value separator within a block mapping"), w && (tr(e, u, h, m, _, null, o, a, l), m = _ = y = null), S = !0, w = !1, i = !1, m = e.tag, _ = e.result;
        else if (S)
          x(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = f, e.anchor = c, !0;
      } else if (S)
        x(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = f, e.anchor = c, !0;
    }
    if ((e.line === s || e.lineIndent > t) && (w && (o = e.line, a = e.lineStart, l = e.position), ur(e, t, Yn, !0, i) && (w ? _ = e.result : y = e.result), w || (tr(e, u, h, m, _, y, o, a, l), m = _ = y = null), fe(e, !0, -1), A = e.input.charCodeAt(e.position)), (e.line === s || e.lineIndent > t) && A !== 0)
      x(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return w && tr(e, u, h, m, _, null, o, a, l), S && (e.tag = f, e.anchor = c, e.kind = "mapping", e.result = u), S;
}
function _E(e) {
  var t, r = !1, n = !1, i, s, o;
  if (o = e.input.charCodeAt(e.position), o !== 33) return !1;
  if (e.tag !== null && x(e, "duplication of a tag property"), o = e.input.charCodeAt(++e.position), o === 60 ? (r = !0, o = e.input.charCodeAt(++e.position)) : o === 33 ? (n = !0, i = "!!", o = e.input.charCodeAt(++e.position)) : i = "!", t = e.position, r) {
    do
      o = e.input.charCodeAt(++e.position);
    while (o !== 0 && o !== 62);
    e.position < e.length ? (s = e.input.slice(t, e.position), o = e.input.charCodeAt(++e.position)) : x(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; o !== 0 && !ke(o); )
      o === 33 && (n ? x(e, "tag suffix cannot contain exclamation marks") : (i = e.input.slice(t - 1, e.position + 1), nf.test(i) || x(e, "named tag handle cannot contain such characters"), n = !0, t = e.position + 1)), o = e.input.charCodeAt(++e.position);
    s = e.input.slice(t, e.position), lE.test(s) && x(e, "tag suffix cannot contain flow indicator characters");
  }
  s && !sf.test(s) && x(e, "tag name cannot contain such characters: " + s);
  try {
    s = decodeURIComponent(s);
  } catch {
    x(e, "tag name is malformed: " + s);
  }
  return r ? e.tag = s : Tt.call(e.tagMap, i) ? e.tag = e.tagMap[i] + s : i === "!" ? e.tag = "!" + s : i === "!!" ? e.tag = "tag:yaml.org,2002:" + s : x(e, 'undeclared tag handle "' + i + '"'), !0;
}
function wE(e) {
  var t, r;
  if (r = e.input.charCodeAt(e.position), r !== 38) return !1;
  for (e.anchor !== null && x(e, "duplication of an anchor property"), r = e.input.charCodeAt(++e.position), t = e.position; r !== 0 && !ke(r) && !er(r); )
    r = e.input.charCodeAt(++e.position);
  return e.position === t && x(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0;
}
function TE(e) {
  var t, r, n;
  if (n = e.input.charCodeAt(e.position), n !== 42) return !1;
  for (n = e.input.charCodeAt(++e.position), t = e.position; n !== 0 && !ke(n) && !er(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === t && x(e, "name of an alias node must contain at least one character"), r = e.input.slice(t, e.position), Tt.call(e.anchorMap, r) || x(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], fe(e, !0, -1), !0;
}
function ur(e, t, r, n, i) {
  var s, o, a, l = 1, f = !1, c = !1, u, h, m, _, y, w;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, s = o = a = Yn === r || rf === r, n && fe(e, !0, -1) && (f = !0, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)), l === 1)
    for (; _E(e) || wE(e); )
      fe(e, !0, -1) ? (f = !0, a = s, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)) : a = !1;
  if (a && (a = f || i), (l === 1 || Yn === r) && (Wn === r || tf === r ? y = t : y = t + 1, w = e.position - e.lineStart, l === 1 ? a && (ja(e, w) || vE(e, w, y)) || EE(e, y) ? c = !0 : (o && yE(e, y) || mE(e, y) || gE(e, y) ? c = !0 : TE(e) ? (c = !0, (e.tag !== null || e.anchor !== null) && x(e, "alias node should not have any properties")) : pE(e, y, Wn === r) && (c = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : l === 0 && (c = a && ja(e, w))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && x(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), u = 0, h = e.implicitTypes.length; u < h; u += 1)
      if (_ = e.implicitTypes[u], _.resolve(e.result)) {
        e.result = _.construct(e.result), e.tag = _.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (Tt.call(e.typeMap[e.kind || "fallback"], e.tag))
      _ = e.typeMap[e.kind || "fallback"][e.tag];
    else
      for (_ = null, m = e.typeMap.multi[e.kind || "fallback"], u = 0, h = m.length; u < h; u += 1)
        if (e.tag.slice(0, m[u].tag.length) === m[u].tag) {
          _ = m[u];
          break;
        }
    _ || x(e, "unknown tag !<" + e.tag + ">"), e.result !== null && _.kind !== e.kind && x(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + _.kind + '", not "' + e.kind + '"'), _.resolve(e.result, e.tag) ? (e.result = _.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : x(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || c;
}
function SE(e) {
  var t = e.position, r, n, i, s = !1, o;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (o = e.input.charCodeAt(e.position)) !== 0 && (fe(e, !0, -1), o = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || o !== 37)); ) {
    for (s = !0, o = e.input.charCodeAt(++e.position), r = e.position; o !== 0 && !ke(o); )
      o = e.input.charCodeAt(++e.position);
    for (n = e.input.slice(r, e.position), i = [], n.length < 1 && x(e, "directive name must not be less than one character in length"); o !== 0; ) {
      for (; kt(o); )
        o = e.input.charCodeAt(++e.position);
      if (o === 35) {
        do
          o = e.input.charCodeAt(++e.position);
        while (o !== 0 && !Ze(o));
        break;
      }
      if (Ze(o)) break;
      for (r = e.position; o !== 0 && !ke(o); )
        o = e.input.charCodeAt(++e.position);
      i.push(e.input.slice(r, e.position));
    }
    o !== 0 && wo(e), Tt.call(ka, n) ? ka[n](e, n, i) : zn(e, 'unknown document directive "' + n + '"');
  }
  if (fe(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, fe(e, !0, -1)) : s && x(e, "directives end mark is expected"), ur(e, e.lineIndent - 1, Yn, !1, !0), fe(e, !0, -1), e.checkLineBreaks && aE.test(e.input.slice(t, e.position)) && zn(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && ai(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, fe(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    x(e, "end of the stream or a document separator is expected");
  else
    return;
}
function cf(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var r = new hE(e, t), n = e.indexOf("\0");
  for (n !== -1 && (r.position = n, x(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    SE(r);
  return r.documents;
}
function AE(e, t, r) {
  t !== null && typeof t == "object" && typeof r > "u" && (r = t, t = null);
  var n = cf(e, r);
  if (typeof t != "function")
    return n;
  for (var i = 0, s = n.length; i < s; i += 1)
    t(n[i]);
}
function bE(e, t) {
  var r = cf(e, t);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new ef("expected a single document in the stream, but found more");
  }
}
yo.loadAll = AE;
yo.load = bE;
var uf = {}, li = Ye, tn = en, OE = _o, ff = Object.prototype.toString, df = Object.prototype.hasOwnProperty, So = 65279, CE = 9, Mr = 10, RE = 13, IE = 32, NE = 33, $E = 34, Gs = 35, DE = 37, PE = 38, FE = 39, LE = 42, hf = 44, xE = 45, Xn = 58, UE = 61, kE = 62, ME = 63, jE = 64, pf = 91, mf = 93, BE = 96, gf = 123, HE = 124, Ef = 125, Oe = {};
Oe[0] = "\\0";
Oe[7] = "\\a";
Oe[8] = "\\b";
Oe[9] = "\\t";
Oe[10] = "\\n";
Oe[11] = "\\v";
Oe[12] = "\\f";
Oe[13] = "\\r";
Oe[27] = "\\e";
Oe[34] = '\\"';
Oe[92] = "\\\\";
Oe[133] = "\\N";
Oe[160] = "\\_";
Oe[8232] = "\\L";
Oe[8233] = "\\P";
var qE = [
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
], GE = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function VE(e, t) {
  var r, n, i, s, o, a, l;
  if (t === null) return {};
  for (r = {}, n = Object.keys(t), i = 0, s = n.length; i < s; i += 1)
    o = n[i], a = String(t[o]), o.slice(0, 2) === "!!" && (o = "tag:yaml.org,2002:" + o.slice(2)), l = e.compiledTypeMap.fallback[o], l && df.call(l.styleAliases, a) && (a = l.styleAliases[a]), r[o] = a;
  return r;
}
function WE(e) {
  var t, r, n;
  if (t = e.toString(16).toUpperCase(), e <= 255)
    r = "x", n = 2;
  else if (e <= 65535)
    r = "u", n = 4;
  else if (e <= 4294967295)
    r = "U", n = 8;
  else
    throw new tn("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + r + li.repeat("0", n - t.length) + t;
}
var YE = 1, jr = 2;
function zE(e) {
  this.schema = e.schema || OE, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = li.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = VE(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? jr : YE, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function Ba(e, t) {
  for (var r = li.repeat(" ", t), n = 0, i = -1, s = "", o, a = e.length; n < a; )
    i = e.indexOf(`
`, n), i === -1 ? (o = e.slice(n), n = a) : (o = e.slice(n, i + 1), n = i + 1), o.length && o !== `
` && (s += r), s += o;
  return s;
}
function Vs(e, t) {
  return `
` + li.repeat(" ", e.indent * t);
}
function XE(e, t) {
  var r, n, i;
  for (r = 0, n = e.implicitTypes.length; r < n; r += 1)
    if (i = e.implicitTypes[r], i.resolve(t))
      return !0;
  return !1;
}
function Kn(e) {
  return e === IE || e === CE;
}
function Br(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== So || 65536 <= e && e <= 1114111;
}
function Ha(e) {
  return Br(e) && e !== So && e !== RE && e !== Mr;
}
function qa(e, t, r) {
  var n = Ha(e), i = n && !Kn(e);
  return (
    // ns-plain-safe
    (r ? (
      // c = flow-in
      n
    ) : n && e !== hf && e !== pf && e !== mf && e !== gf && e !== Ef) && e !== Gs && !(t === Xn && !i) || Ha(t) && !Kn(t) && e === Gs || t === Xn && i
  );
}
function KE(e) {
  return Br(e) && e !== So && !Kn(e) && e !== xE && e !== ME && e !== Xn && e !== hf && e !== pf && e !== mf && e !== gf && e !== Ef && e !== Gs && e !== PE && e !== LE && e !== NE && e !== HE && e !== UE && e !== kE && e !== FE && e !== $E && e !== DE && e !== jE && e !== BE;
}
function JE(e) {
  return !Kn(e) && e !== Xn;
}
function Rr(e, t) {
  var r = e.charCodeAt(t), n;
  return r >= 55296 && r <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1), n >= 56320 && n <= 57343) ? (r - 55296) * 1024 + n - 56320 + 65536 : r;
}
function yf(e) {
  var t = /^\n* /;
  return t.test(e);
}
var vf = 1, Ws = 2, _f = 3, wf = 4, Zt = 5;
function QE(e, t, r, n, i, s, o, a) {
  var l, f = 0, c = null, u = !1, h = !1, m = n !== -1, _ = -1, y = KE(Rr(e, 0)) && JE(Rr(e, e.length - 1));
  if (t || o)
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Rr(e, l), !Br(f))
        return Zt;
      y = y && qa(f, c, a), c = f;
    }
  else {
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Rr(e, l), f === Mr)
        u = !0, m && (h = h || // Foldable line = too long, and not more-indented.
        l - _ - 1 > n && e[_ + 1] !== " ", _ = l);
      else if (!Br(f))
        return Zt;
      y = y && qa(f, c, a), c = f;
    }
    h = h || m && l - _ - 1 > n && e[_ + 1] !== " ";
  }
  return !u && !h ? y && !o && !i(e) ? vf : s === jr ? Zt : Ws : r > 9 && yf(e) ? Zt : o ? s === jr ? Zt : Ws : h ? wf : _f;
}
function ZE(e, t, r, n, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === jr ? '""' : "''";
    if (!e.noCompatMode && (qE.indexOf(t) !== -1 || GE.test(t)))
      return e.quotingType === jr ? '"' + t + '"' : "'" + t + "'";
    var s = e.indent * Math.max(1, r), o = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - s), a = n || e.flowLevel > -1 && r >= e.flowLevel;
    function l(f) {
      return XE(e, f);
    }
    switch (QE(
      t,
      a,
      e.indent,
      o,
      l,
      e.quotingType,
      e.forceQuotes && !n,
      i
    )) {
      case vf:
        return t;
      case Ws:
        return "'" + t.replace(/'/g, "''") + "'";
      case _f:
        return "|" + Ga(t, e.indent) + Va(Ba(t, s));
      case wf:
        return ">" + Ga(t, e.indent) + Va(Ba(ey(t, o), s));
      case Zt:
        return '"' + ty(t) + '"';
      default:
        throw new tn("impossible error: invalid scalar style");
    }
  }();
}
function Ga(e, t) {
  var r = yf(e) ? String(t) : "", n = e[e.length - 1] === `
`, i = n && (e[e.length - 2] === `
` || e === `
`), s = i ? "+" : n ? "" : "-";
  return r + s + `
`;
}
function Va(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function ey(e, t) {
  for (var r = /(\n+)([^\n]*)/g, n = function() {
    var f = e.indexOf(`
`);
    return f = f !== -1 ? f : e.length, r.lastIndex = f, Wa(e.slice(0, f), t);
  }(), i = e[0] === `
` || e[0] === " ", s, o; o = r.exec(e); ) {
    var a = o[1], l = o[2];
    s = l[0] === " ", n += a + (!i && !s && l !== "" ? `
` : "") + Wa(l, t), i = s;
  }
  return n;
}
function Wa(e, t) {
  if (e === "" || e[0] === " ") return e;
  for (var r = / [^ ]/g, n, i = 0, s, o = 0, a = 0, l = ""; n = r.exec(e); )
    a = n.index, a - i > t && (s = o > i ? o : a, l += `
` + e.slice(i, s), i = s + 1), o = a;
  return l += `
`, e.length - i > t && o > i ? l += e.slice(i, o) + `
` + e.slice(o + 1) : l += e.slice(i), l.slice(1);
}
function ty(e) {
  for (var t = "", r = 0, n, i = 0; i < e.length; r >= 65536 ? i += 2 : i++)
    r = Rr(e, i), n = Oe[r], !n && Br(r) ? (t += e[i], r >= 65536 && (t += e[i + 1])) : t += n || WE(r);
  return t;
}
function ry(e, t, r) {
  var n = "", i = e.tag, s, o, a;
  for (s = 0, o = r.length; s < o; s += 1)
    a = r[s], e.replacer && (a = e.replacer.call(r, String(s), a)), (it(e, t, a, !1, !1) || typeof a > "u" && it(e, t, null, !1, !1)) && (n !== "" && (n += "," + (e.condenseFlow ? "" : " ")), n += e.dump);
  e.tag = i, e.dump = "[" + n + "]";
}
function Ya(e, t, r, n) {
  var i = "", s = e.tag, o, a, l;
  for (o = 0, a = r.length; o < a; o += 1)
    l = r[o], e.replacer && (l = e.replacer.call(r, String(o), l)), (it(e, t + 1, l, !0, !0, !1, !0) || typeof l > "u" && it(e, t + 1, null, !0, !0, !1, !0)) && ((!n || i !== "") && (i += Vs(e, t)), e.dump && Mr === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  e.tag = s, e.dump = i || "[]";
}
function ny(e, t, r) {
  var n = "", i = e.tag, s = Object.keys(r), o, a, l, f, c;
  for (o = 0, a = s.length; o < a; o += 1)
    c = "", n !== "" && (c += ", "), e.condenseFlow && (c += '"'), l = s[o], f = r[l], e.replacer && (f = e.replacer.call(r, l, f)), it(e, t, l, !1, !1) && (e.dump.length > 1024 && (c += "? "), c += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), it(e, t, f, !1, !1) && (c += e.dump, n += c));
  e.tag = i, e.dump = "{" + n + "}";
}
function iy(e, t, r, n) {
  var i = "", s = e.tag, o = Object.keys(r), a, l, f, c, u, h;
  if (e.sortKeys === !0)
    o.sort();
  else if (typeof e.sortKeys == "function")
    o.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new tn("sortKeys must be a boolean or a function");
  for (a = 0, l = o.length; a < l; a += 1)
    h = "", (!n || i !== "") && (h += Vs(e, t)), f = o[a], c = r[f], e.replacer && (c = e.replacer.call(r, f, c)), it(e, t + 1, f, !0, !0, !0) && (u = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, u && (e.dump && Mr === e.dump.charCodeAt(0) ? h += "?" : h += "? "), h += e.dump, u && (h += Vs(e, t)), it(e, t + 1, c, !0, u) && (e.dump && Mr === e.dump.charCodeAt(0) ? h += ":" : h += ": ", h += e.dump, i += h));
  e.tag = s, e.dump = i || "{}";
}
function za(e, t, r) {
  var n, i, s, o, a, l;
  for (i = r ? e.explicitTypes : e.implicitTypes, s = 0, o = i.length; s < o; s += 1)
    if (a = i[s], (a.instanceOf || a.predicate) && (!a.instanceOf || typeof t == "object" && t instanceof a.instanceOf) && (!a.predicate || a.predicate(t))) {
      if (r ? a.multi && a.representName ? e.tag = a.representName(t) : e.tag = a.tag : e.tag = "?", a.represent) {
        if (l = e.styleMap[a.tag] || a.defaultStyle, ff.call(a.represent) === "[object Function]")
          n = a.represent(t, l);
        else if (df.call(a.represent, l))
          n = a.represent[l](t, l);
        else
          throw new tn("!<" + a.tag + '> tag resolver accepts not "' + l + '" style');
        e.dump = n;
      }
      return !0;
    }
  return !1;
}
function it(e, t, r, n, i, s, o) {
  e.tag = null, e.dump = r, za(e, r, !1) || za(e, r, !0);
  var a = ff.call(e.dump), l = n, f;
  n && (n = e.flowLevel < 0 || e.flowLevel > t);
  var c = a === "[object Object]" || a === "[object Array]", u, h;
  if (c && (u = e.duplicates.indexOf(r), h = u !== -1), (e.tag !== null && e.tag !== "?" || h || e.indent !== 2 && t > 0) && (i = !1), h && e.usedDuplicates[u])
    e.dump = "*ref_" + u;
  else {
    if (c && h && !e.usedDuplicates[u] && (e.usedDuplicates[u] = !0), a === "[object Object]")
      n && Object.keys(e.dump).length !== 0 ? (iy(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (ny(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object Array]")
      n && e.dump.length !== 0 ? (e.noArrayIndent && !o && t > 0 ? Ya(e, t - 1, e.dump, i) : Ya(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (ry(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && ZE(e, e.dump, t, s, l);
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
function sy(e, t) {
  var r = [], n = [], i, s;
  for (Ys(e, r, n), i = 0, s = n.length; i < s; i += 1)
    t.duplicates.push(r[n[i]]);
  t.usedDuplicates = new Array(s);
}
function Ys(e, t, r) {
  var n, i, s;
  if (e !== null && typeof e == "object")
    if (i = t.indexOf(e), i !== -1)
      r.indexOf(i) === -1 && r.push(i);
    else if (t.push(e), Array.isArray(e))
      for (i = 0, s = e.length; i < s; i += 1)
        Ys(e[i], t, r);
    else
      for (n = Object.keys(e), i = 0, s = n.length; i < s; i += 1)
        Ys(e[n[i]], t, r);
}
function oy(e, t) {
  t = t || {};
  var r = new zE(t);
  r.noRefs || sy(e, r);
  var n = e;
  return r.replacer && (n = r.replacer.call({ "": n }, "", n)), it(r, 0, n, !0, !0) ? r.dump + `
` : "";
}
uf.dump = oy;
var Tf = yo, ay = uf;
function Ao(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
Te.Type = Fe;
Te.Schema = Fu;
Te.FAILSAFE_SCHEMA = ku;
Te.JSON_SCHEMA = Gu;
Te.CORE_SCHEMA = Vu;
Te.DEFAULT_SCHEMA = _o;
Te.load = Tf.load;
Te.loadAll = Tf.loadAll;
Te.dump = ay.dump;
Te.YAMLException = en;
Te.types = {
  binary: Ku,
  float: qu,
  map: Uu,
  null: Mu,
  pairs: Qu,
  set: Zu,
  timestamp: zu,
  bool: ju,
  int: Bu,
  merge: Xu,
  omap: Ju,
  seq: xu,
  str: Lu
};
Te.safeLoad = Ao("safeLoad", "load");
Te.safeLoadAll = Ao("safeLoadAll", "loadAll");
Te.safeDump = Ao("safeDump", "dump");
var ci = {};
Object.defineProperty(ci, "__esModule", { value: !0 });
ci.Lazy = void 0;
class ly {
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
ci.Lazy = ly;
var zs = { exports: {} };
const cy = "2.0.0", Sf = 256, uy = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, fy = 16, dy = Sf - 6, hy = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var ui = {
  MAX_LENGTH: Sf,
  MAX_SAFE_COMPONENT_LENGTH: fy,
  MAX_SAFE_BUILD_LENGTH: dy,
  MAX_SAFE_INTEGER: uy,
  RELEASE_TYPES: hy,
  SEMVER_SPEC_VERSION: cy,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const py = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var fi = py;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: i
  } = ui, s = fi;
  t = e.exports = {};
  const o = t.re = [], a = t.safeRe = [], l = t.src = [], f = t.safeSrc = [], c = t.t = {};
  let u = 0;
  const h = "[a-zA-Z0-9-]", m = [
    ["\\s", 1],
    ["\\d", i],
    [h, n]
  ], _ = (w) => {
    for (const [S, A] of m)
      w = w.split(`${S}*`).join(`${S}{0,${A}}`).split(`${S}+`).join(`${S}{1,${A}}`);
    return w;
  }, y = (w, S, A) => {
    const D = _(S), L = u++;
    s(w, L, S), c[w] = L, l[L] = S, f[L] = D, o[L] = new RegExp(S, A ? "g" : void 0), a[L] = new RegExp(D, A ? "g" : void 0);
  };
  y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${h}*`), y("MAINVERSION", `(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${l[c.PRERELEASEIDENTIFIER]}(?:\\.${l[c.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${l[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[c.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${h}+`), y("BUILD", `(?:\\+(${l[c.BUILDIDENTIFIER]}(?:\\.${l[c.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${l[c.MAINVERSION]}${l[c.PRERELEASE]}?${l[c.BUILD]}?`), y("FULL", `^${l[c.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${l[c.MAINVERSIONLOOSE]}${l[c.PRERELEASELOOSE]}?${l[c.BUILD]}?`), y("LOOSE", `^${l[c.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${l[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${l[c.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:${l[c.PRERELEASE]})?${l[c.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:${l[c.PRERELEASELOOSE]})?${l[c.BUILD]}?)?)?`), y("XRANGE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), y("COERCE", `${l[c.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", l[c.COERCEPLAIN] + `(?:${l[c.PRERELEASE]})?(?:${l[c.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", l[c.COERCE], !0), y("COERCERTLFULL", l[c.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${l[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", y("TILDE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${l[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", y("CARET", `^${l[c.LONECARET]}${l[c.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${l[c.LONECARET]}${l[c.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${l[c.GTLT]}\\s*(${l[c.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]}|${l[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${l[c.XRANGEPLAIN]})\\s+-\\s+(${l[c.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${l[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[c.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(zs, zs.exports);
var rn = zs.exports;
const my = Object.freeze({ loose: !0 }), gy = Object.freeze({}), Ey = (e) => e ? typeof e != "object" ? my : e : gy;
var bo = Ey;
const Xa = /^[0-9]+$/, Af = (e, t) => {
  const r = Xa.test(e), n = Xa.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, yy = (e, t) => Af(t, e);
var bf = {
  compareIdentifiers: Af,
  rcompareIdentifiers: yy
};
const An = fi, { MAX_LENGTH: Ka, MAX_SAFE_INTEGER: bn } = ui, { safeRe: On, t: Cn } = rn, vy = bo, { compareIdentifiers: zt } = bf;
let _y = class Qe {
  constructor(t, r) {
    if (r = vy(r), t instanceof Qe) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > Ka)
      throw new TypeError(
        `version is longer than ${Ka} characters`
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
        const s = +i;
        if (s >= 0 && s < bn)
          return s;
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
    if (An("SemVer.compare", this.version, this.options, t), !(t instanceof Qe)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Qe(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Qe || (t = new Qe(t, this.options)), zt(this.major, t.major) || zt(this.minor, t.minor) || zt(this.patch, t.patch);
  }
  comparePre(t) {
    if (t instanceof Qe || (t = new Qe(t, this.options)), this.prerelease.length && !t.prerelease.length)
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
      return zt(n, i);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Qe || (t = new Qe(t, this.options));
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
      return zt(n, i);
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
          let s = this.prerelease.length;
          for (; --s >= 0; )
            typeof this.prerelease[s] == "number" && (this.prerelease[s]++, s = -2);
          if (s === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(i);
          }
        }
        if (r) {
          let s = [r, i];
          n === !1 && (s = [r]), zt(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = s) : this.prerelease = s;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var Le = _y;
const Ja = Le, wy = (e, t, r = !1) => {
  if (e instanceof Ja)
    return e;
  try {
    return new Ja(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var mr = wy;
const Ty = mr, Sy = (e, t) => {
  const r = Ty(e, t);
  return r ? r.version : null;
};
var Ay = Sy;
const by = mr, Oy = (e, t) => {
  const r = by(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var Cy = Oy;
const Qa = Le, Ry = (e, t, r, n, i) => {
  typeof r == "string" && (i = n, n = r, r = void 0);
  try {
    return new Qa(
      e instanceof Qa ? e.version : e,
      r
    ).inc(t, n, i).version;
  } catch {
    return null;
  }
};
var Iy = Ry;
const Za = mr, Ny = (e, t) => {
  const r = Za(e, null, !0), n = Za(t, null, !0), i = r.compare(n);
  if (i === 0)
    return null;
  const s = i > 0, o = s ? r : n, a = s ? n : r, l = !!o.prerelease.length;
  if (!!a.prerelease.length && !l) {
    if (!a.patch && !a.minor)
      return "major";
    if (a.compareMain(o) === 0)
      return a.minor && !a.patch ? "minor" : "patch";
  }
  const c = l ? "pre" : "";
  return r.major !== n.major ? c + "major" : r.minor !== n.minor ? c + "minor" : r.patch !== n.patch ? c + "patch" : "prerelease";
};
var $y = Ny;
const Dy = Le, Py = (e, t) => new Dy(e, t).major;
var Fy = Py;
const Ly = Le, xy = (e, t) => new Ly(e, t).minor;
var Uy = xy;
const ky = Le, My = (e, t) => new ky(e, t).patch;
var jy = My;
const By = mr, Hy = (e, t) => {
  const r = By(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var qy = Hy;
const el = Le, Gy = (e, t, r) => new el(e, r).compare(new el(t, r));
var ze = Gy;
const Vy = ze, Wy = (e, t, r) => Vy(t, e, r);
var Yy = Wy;
const zy = ze, Xy = (e, t) => zy(e, t, !0);
var Ky = Xy;
const tl = Le, Jy = (e, t, r) => {
  const n = new tl(e, r), i = new tl(t, r);
  return n.compare(i) || n.compareBuild(i);
};
var Oo = Jy;
const Qy = Oo, Zy = (e, t) => e.sort((r, n) => Qy(r, n, t));
var ev = Zy;
const tv = Oo, rv = (e, t) => e.sort((r, n) => tv(n, r, t));
var nv = rv;
const iv = ze, sv = (e, t, r) => iv(e, t, r) > 0;
var di = sv;
const ov = ze, av = (e, t, r) => ov(e, t, r) < 0;
var Co = av;
const lv = ze, cv = (e, t, r) => lv(e, t, r) === 0;
var Of = cv;
const uv = ze, fv = (e, t, r) => uv(e, t, r) !== 0;
var Cf = fv;
const dv = ze, hv = (e, t, r) => dv(e, t, r) >= 0;
var Ro = hv;
const pv = ze, mv = (e, t, r) => pv(e, t, r) <= 0;
var Io = mv;
const gv = Of, Ev = Cf, yv = di, vv = Ro, _v = Co, wv = Io, Tv = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return gv(e, r, n);
    case "!=":
      return Ev(e, r, n);
    case ">":
      return yv(e, r, n);
    case ">=":
      return vv(e, r, n);
    case "<":
      return _v(e, r, n);
    case "<=":
      return wv(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var Rf = Tv;
const Sv = Le, Av = mr, { safeRe: Rn, t: In } = rn, bv = (e, t) => {
  if (e instanceof Sv)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? Rn[In.COERCEFULL] : Rn[In.COERCE]);
  else {
    const l = t.includePrerelease ? Rn[In.COERCERTLFULL] : Rn[In.COERCERTL];
    let f;
    for (; (f = l.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || f.index + f[0].length !== r.index + r[0].length) && (r = f), l.lastIndex = f.index + f[1].length + f[2].length;
    l.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], i = r[3] || "0", s = r[4] || "0", o = t.includePrerelease && r[5] ? `-${r[5]}` : "", a = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return Av(`${n}.${i}.${s}${o}${a}`, t);
};
var Ov = bv;
class Cv {
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
var Rv = Cv, Gi, rl;
function Xe() {
  if (rl) return Gi;
  rl = 1;
  const e = /\s+/g;
  class t {
    constructor(C, $) {
      if ($ = i($), C instanceof t)
        return C.loose === !!$.loose && C.includePrerelease === !!$.includePrerelease ? C : new t(C.raw, $);
      if (C instanceof s)
        return this.raw = C.value, this.set = [[C]], this.formatted = void 0, this;
      if (this.options = $, this.loose = !!$.loose, this.includePrerelease = !!$.includePrerelease, this.raw = C.trim().replace(e, " "), this.set = this.raw.split("||").map((O) => this.parseRange(O.trim())).filter((O) => O.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const O = this.set[0];
        if (this.set = this.set.filter((P) => !y(P[0])), this.set.length === 0)
          this.set = [O];
        else if (this.set.length > 1) {
          for (const P of this.set)
            if (P.length === 1 && w(P[0])) {
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
      const O = ((this.options.includePrerelease && m) | (this.options.loose && _)) + ":" + C, P = n.get(O);
      if (P)
        return P;
      const N = this.options.loose, k = N ? l[f.HYPHENRANGELOOSE] : l[f.HYPHENRANGE];
      C = C.replace(k, M(this.options.includePrerelease)), o("hyphen replace", C), C = C.replace(l[f.COMPARATORTRIM], c), o("comparator trim", C), C = C.replace(l[f.TILDETRIM], u), o("tilde trim", C), C = C.replace(l[f.CARETTRIM], h), o("caret trim", C);
      let z = C.split(" ").map((U) => A(U, this.options)).join(" ").split(/\s+/).map((U) => q(U, this.options));
      N && (z = z.filter((U) => (o("loose invalid filter", U, this.options), !!U.match(l[f.COMPARATORLOOSE])))), o("range list", z);
      const G = /* @__PURE__ */ new Map(), te = z.map((U) => new s(U, this.options));
      for (const U of te) {
        if (y(U))
          return [U];
        G.set(U.value, U);
      }
      G.size > 1 && G.has("") && G.delete("");
      const me = [...G.values()];
      return n.set(O, me), me;
    }
    intersects(C, $) {
      if (!(C instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((O) => S(O, $) && C.set.some((P) => S(P, $) && O.every((N) => P.every((k) => N.intersects(k, $)))));
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
  Gi = t;
  const r = Rv, n = new r(), i = bo, s = hi(), o = fi, a = Le, {
    safeRe: l,
    t: f,
    comparatorTrimReplace: c,
    tildeTrimReplace: u,
    caretTrimReplace: h
  } = rn, { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: _ } = ui, y = (I) => I.value === "<0.0.0-0", w = (I) => I.value === "", S = (I, C) => {
    let $ = !0;
    const O = I.slice();
    let P = O.pop();
    for (; $ && O.length; )
      $ = O.every((N) => P.intersects(N, C)), P = O.pop();
    return $;
  }, A = (I, C) => (o("comp", I, C), I = H(I, C), o("caret", I), I = L(I, C), o("tildes", I), I = ue(I, C), o("xrange", I), I = Y(I, C), o("stars", I), I), D = (I) => !I || I.toLowerCase() === "x" || I === "*", L = (I, C) => I.trim().split(/\s+/).map(($) => B($, C)).join(" "), B = (I, C) => {
    const $ = C.loose ? l[f.TILDELOOSE] : l[f.TILDE];
    return I.replace($, (O, P, N, k, z) => {
      o("tilde", I, O, P, N, k, z);
      let G;
      return D(P) ? G = "" : D(N) ? G = `>=${P}.0.0 <${+P + 1}.0.0-0` : D(k) ? G = `>=${P}.${N}.0 <${P}.${+N + 1}.0-0` : z ? (o("replaceTilde pr", z), G = `>=${P}.${N}.${k}-${z} <${P}.${+N + 1}.0-0`) : G = `>=${P}.${N}.${k} <${P}.${+N + 1}.0-0`, o("tilde return", G), G;
    });
  }, H = (I, C) => I.trim().split(/\s+/).map(($) => j($, C)).join(" "), j = (I, C) => {
    o("caret", I, C);
    const $ = C.loose ? l[f.CARETLOOSE] : l[f.CARET], O = C.includePrerelease ? "-0" : "";
    return I.replace($, (P, N, k, z, G) => {
      o("caret", I, P, N, k, z, G);
      let te;
      return D(N) ? te = "" : D(k) ? te = `>=${N}.0.0${O} <${+N + 1}.0.0-0` : D(z) ? N === "0" ? te = `>=${N}.${k}.0${O} <${N}.${+k + 1}.0-0` : te = `>=${N}.${k}.0${O} <${+N + 1}.0.0-0` : G ? (o("replaceCaret pr", G), N === "0" ? k === "0" ? te = `>=${N}.${k}.${z}-${G} <${N}.${k}.${+z + 1}-0` : te = `>=${N}.${k}.${z}-${G} <${N}.${+k + 1}.0-0` : te = `>=${N}.${k}.${z}-${G} <${+N + 1}.0.0-0`) : (o("no pr"), N === "0" ? k === "0" ? te = `>=${N}.${k}.${z}${O} <${N}.${k}.${+z + 1}-0` : te = `>=${N}.${k}.${z}${O} <${N}.${+k + 1}.0-0` : te = `>=${N}.${k}.${z} <${+N + 1}.0.0-0`), o("caret return", te), te;
    });
  }, ue = (I, C) => (o("replaceXRanges", I, C), I.split(/\s+/).map(($) => E($, C)).join(" ")), E = (I, C) => {
    I = I.trim();
    const $ = C.loose ? l[f.XRANGELOOSE] : l[f.XRANGE];
    return I.replace($, (O, P, N, k, z, G) => {
      o("xRange", I, O, P, N, k, z, G);
      const te = D(N), me = te || D(k), U = me || D(z), Ke = U;
      return P === "=" && Ke && (P = ""), G = C.includePrerelease ? "-0" : "", te ? P === ">" || P === "<" ? O = "<0.0.0-0" : O = "*" : P && Ke ? (me && (k = 0), z = 0, P === ">" ? (P = ">=", me ? (N = +N + 1, k = 0, z = 0) : (k = +k + 1, z = 0)) : P === "<=" && (P = "<", me ? N = +N + 1 : k = +k + 1), P === "<" && (G = "-0"), O = `${P + N}.${k}.${z}${G}`) : me ? O = `>=${N}.0.0${G} <${+N + 1}.0.0-0` : U && (O = `>=${N}.${k}.0${G} <${N}.${+k + 1}.0-0`), o("xRange return", O), O;
    });
  }, Y = (I, C) => (o("replaceStars", I, C), I.trim().replace(l[f.STAR], "")), q = (I, C) => (o("replaceGTE0", I, C), I.trim().replace(l[C.includePrerelease ? f.GTE0PRE : f.GTE0], "")), M = (I) => (C, $, O, P, N, k, z, G, te, me, U, Ke) => (D(O) ? $ = "" : D(P) ? $ = `>=${O}.0.0${I ? "-0" : ""}` : D(N) ? $ = `>=${O}.${P}.0${I ? "-0" : ""}` : k ? $ = `>=${$}` : $ = `>=${$}${I ? "-0" : ""}`, D(te) ? G = "" : D(me) ? G = `<${+te + 1}.0.0-0` : D(U) ? G = `<${te}.${+me + 1}.0-0` : Ke ? G = `<=${te}.${me}.${U}-${Ke}` : I ? G = `<${te}.${me}.${+U + 1}-0` : G = `<=${G}`, `${$} ${G}`.trim()), ee = (I, C, $) => {
    for (let O = 0; O < I.length; O++)
      if (!I[O].test(C))
        return !1;
    if (C.prerelease.length && !$.includePrerelease) {
      for (let O = 0; O < I.length; O++)
        if (o(I[O].semver), I[O].semver !== s.ANY && I[O].semver.prerelease.length > 0) {
          const P = I[O].semver;
          if (P.major === C.major && P.minor === C.minor && P.patch === C.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Gi;
}
var Vi, nl;
function hi() {
  if (nl) return Vi;
  nl = 1;
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
      c = c.trim().split(/\s+/).join(" "), o("comparator", c, u), this.options = u, this.loose = !!u.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, o("comp", this);
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
      if (o("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new a(c, this.options);
        } catch {
          return !1;
        }
      return s(c, this.operator, this.semver, this.options);
    }
    intersects(c, u) {
      if (!(c instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new l(c.value, u).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new l(this.value, u).test(c.semver) : (u = r(u), u.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !u.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || s(this.semver, "<", c.semver, u) && this.operator.startsWith(">") && c.operator.startsWith("<") || s(this.semver, ">", c.semver, u) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  Vi = t;
  const r = bo, { safeRe: n, t: i } = rn, s = Rf, o = fi, a = Le, l = Xe();
  return Vi;
}
const Iv = Xe(), Nv = (e, t, r) => {
  try {
    t = new Iv(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var pi = Nv;
const $v = Xe(), Dv = (e, t) => new $v(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var Pv = Dv;
const Fv = Le, Lv = Xe(), xv = (e, t, r) => {
  let n = null, i = null, s = null;
  try {
    s = new Lv(t, r);
  } catch {
    return null;
  }
  return e.forEach((o) => {
    s.test(o) && (!n || i.compare(o) === -1) && (n = o, i = new Fv(n, r));
  }), n;
};
var Uv = xv;
const kv = Le, Mv = Xe(), jv = (e, t, r) => {
  let n = null, i = null, s = null;
  try {
    s = new Mv(t, r);
  } catch {
    return null;
  }
  return e.forEach((o) => {
    s.test(o) && (!n || i.compare(o) === 1) && (n = o, i = new kv(n, r));
  }), n;
};
var Bv = jv;
const Wi = Le, Hv = Xe(), il = di, qv = (e, t) => {
  e = new Hv(e, t);
  let r = new Wi("0.0.0");
  if (e.test(r) || (r = new Wi("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const i = e.set[n];
    let s = null;
    i.forEach((o) => {
      const a = new Wi(o.semver.version);
      switch (o.operator) {
        case ">":
          a.prerelease.length === 0 ? a.patch++ : a.prerelease.push(0), a.raw = a.format();
        case "":
        case ">=":
          (!s || il(a, s)) && (s = a);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${o.operator}`);
      }
    }), s && (!r || il(r, s)) && (r = s);
  }
  return r && e.test(r) ? r : null;
};
var Gv = qv;
const Vv = Xe(), Wv = (e, t) => {
  try {
    return new Vv(e, t).range || "*";
  } catch {
    return null;
  }
};
var Yv = Wv;
const zv = Le, If = hi(), { ANY: Xv } = If, Kv = Xe(), Jv = pi, sl = di, ol = Co, Qv = Io, Zv = Ro, e_ = (e, t, r, n) => {
  e = new zv(e, n), t = new Kv(t, n);
  let i, s, o, a, l;
  switch (r) {
    case ">":
      i = sl, s = Qv, o = ol, a = ">", l = ">=";
      break;
    case "<":
      i = ol, s = Zv, o = sl, a = "<", l = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (Jv(e, t, n))
    return !1;
  for (let f = 0; f < t.set.length; ++f) {
    const c = t.set[f];
    let u = null, h = null;
    if (c.forEach((m) => {
      m.semver === Xv && (m = new If(">=0.0.0")), u = u || m, h = h || m, i(m.semver, u.semver, n) ? u = m : o(m.semver, h.semver, n) && (h = m);
    }), u.operator === a || u.operator === l || (!h.operator || h.operator === a) && s(e, h.semver))
      return !1;
    if (h.operator === l && o(e, h.semver))
      return !1;
  }
  return !0;
};
var No = e_;
const t_ = No, r_ = (e, t, r) => t_(e, t, ">", r);
var n_ = r_;
const i_ = No, s_ = (e, t, r) => i_(e, t, "<", r);
var o_ = s_;
const al = Xe(), a_ = (e, t, r) => (e = new al(e, r), t = new al(t, r), e.intersects(t, r));
var l_ = a_;
const c_ = pi, u_ = ze;
var f_ = (e, t, r) => {
  const n = [];
  let i = null, s = null;
  const o = e.sort((c, u) => u_(c, u, r));
  for (const c of o)
    c_(c, t, r) ? (s = c, i || (i = c)) : (s && n.push([i, s]), s = null, i = null);
  i && n.push([i, null]);
  const a = [];
  for (const [c, u] of n)
    c === u ? a.push(c) : !u && c === o[0] ? a.push("*") : u ? c === o[0] ? a.push(`<=${u}`) : a.push(`${c} - ${u}`) : a.push(`>=${c}`);
  const l = a.join(" || "), f = typeof t.raw == "string" ? t.raw : String(t);
  return l.length < f.length ? l : t;
};
const ll = Xe(), $o = hi(), { ANY: Yi } = $o, Ar = pi, Do = ze, d_ = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new ll(e, r), t = new ll(t, r);
  let n = !1;
  e: for (const i of e.set) {
    for (const s of t.set) {
      const o = p_(i, s, r);
      if (n = n || o !== null, o)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, h_ = [new $o(">=0.0.0-0")], cl = [new $o(">=0.0.0")], p_ = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === Yi) {
    if (t.length === 1 && t[0].semver === Yi)
      return !0;
    r.includePrerelease ? e = h_ : e = cl;
  }
  if (t.length === 1 && t[0].semver === Yi) {
    if (r.includePrerelease)
      return !0;
    t = cl;
  }
  const n = /* @__PURE__ */ new Set();
  let i, s;
  for (const m of e)
    m.operator === ">" || m.operator === ">=" ? i = ul(i, m, r) : m.operator === "<" || m.operator === "<=" ? s = fl(s, m, r) : n.add(m.semver);
  if (n.size > 1)
    return null;
  let o;
  if (i && s) {
    if (o = Do(i.semver, s.semver, r), o > 0)
      return null;
    if (o === 0 && (i.operator !== ">=" || s.operator !== "<="))
      return null;
  }
  for (const m of n) {
    if (i && !Ar(m, String(i), r) || s && !Ar(m, String(s), r))
      return null;
    for (const _ of t)
      if (!Ar(m, String(_), r))
        return !1;
    return !0;
  }
  let a, l, f, c, u = s && !r.includePrerelease && s.semver.prerelease.length ? s.semver : !1, h = i && !r.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  u && u.prerelease.length === 1 && s.operator === "<" && u.prerelease[0] === 0 && (u = !1);
  for (const m of t) {
    if (c = c || m.operator === ">" || m.operator === ">=", f = f || m.operator === "<" || m.operator === "<=", i) {
      if (h && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === h.major && m.semver.minor === h.minor && m.semver.patch === h.patch && (h = !1), m.operator === ">" || m.operator === ">=") {
        if (a = ul(i, m, r), a === m && a !== i)
          return !1;
      } else if (i.operator === ">=" && !Ar(i.semver, String(m), r))
        return !1;
    }
    if (s) {
      if (u && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === u.major && m.semver.minor === u.minor && m.semver.patch === u.patch && (u = !1), m.operator === "<" || m.operator === "<=") {
        if (l = fl(s, m, r), l === m && l !== s)
          return !1;
      } else if (s.operator === "<=" && !Ar(s.semver, String(m), r))
        return !1;
    }
    if (!m.operator && (s || i) && o !== 0)
      return !1;
  }
  return !(i && f && !s && o !== 0 || s && c && !i && o !== 0 || h || u);
}, ul = (e, t, r) => {
  if (!e)
    return t;
  const n = Do(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, fl = (e, t, r) => {
  if (!e)
    return t;
  const n = Do(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var m_ = d_;
const zi = rn, dl = ui, g_ = Le, hl = bf, E_ = mr, y_ = Ay, v_ = Cy, __ = Iy, w_ = $y, T_ = Fy, S_ = Uy, A_ = jy, b_ = qy, O_ = ze, C_ = Yy, R_ = Ky, I_ = Oo, N_ = ev, $_ = nv, D_ = di, P_ = Co, F_ = Of, L_ = Cf, x_ = Ro, U_ = Io, k_ = Rf, M_ = Ov, j_ = hi(), B_ = Xe(), H_ = pi, q_ = Pv, G_ = Uv, V_ = Bv, W_ = Gv, Y_ = Yv, z_ = No, X_ = n_, K_ = o_, J_ = l_, Q_ = f_, Z_ = m_;
var Nf = {
  parse: E_,
  valid: y_,
  clean: v_,
  inc: __,
  diff: w_,
  major: T_,
  minor: S_,
  patch: A_,
  prerelease: b_,
  compare: O_,
  rcompare: C_,
  compareLoose: R_,
  compareBuild: I_,
  sort: N_,
  rsort: $_,
  gt: D_,
  lt: P_,
  eq: F_,
  neq: L_,
  gte: x_,
  lte: U_,
  cmp: k_,
  coerce: M_,
  Comparator: j_,
  Range: B_,
  satisfies: H_,
  toComparators: q_,
  maxSatisfying: G_,
  minSatisfying: V_,
  minVersion: W_,
  validRange: Y_,
  outside: z_,
  gtr: X_,
  ltr: K_,
  intersects: J_,
  simplifyRange: Q_,
  subset: Z_,
  SemVer: g_,
  re: zi.re,
  src: zi.src,
  tokens: zi.t,
  SEMVER_SPEC_VERSION: dl.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: dl.RELEASE_TYPES,
  compareIdentifiers: hl.compareIdentifiers,
  rcompareIdentifiers: hl.rcompareIdentifiers
}, nn = {}, Jn = { exports: {} };
Jn.exports;
(function(e, t) {
  var r = 200, n = "__lodash_hash_undefined__", i = 1, s = 2, o = 9007199254740991, a = "[object Arguments]", l = "[object Array]", f = "[object AsyncFunction]", c = "[object Boolean]", u = "[object Date]", h = "[object Error]", m = "[object Function]", _ = "[object GeneratorFunction]", y = "[object Map]", w = "[object Number]", S = "[object Null]", A = "[object Object]", D = "[object Promise]", L = "[object Proxy]", B = "[object RegExp]", H = "[object Set]", j = "[object String]", ue = "[object Symbol]", E = "[object Undefined]", Y = "[object WeakMap]", q = "[object ArrayBuffer]", M = "[object DataView]", ee = "[object Float32Array]", I = "[object Float64Array]", C = "[object Int8Array]", $ = "[object Int16Array]", O = "[object Int32Array]", P = "[object Uint8Array]", N = "[object Uint8ClampedArray]", k = "[object Uint16Array]", z = "[object Uint32Array]", G = /[\\^$.*+?()[\]{}|]/g, te = /^\[object .+?Constructor\]$/, me = /^(?:0|[1-9]\d*)$/, U = {};
  U[ee] = U[I] = U[C] = U[$] = U[O] = U[P] = U[N] = U[k] = U[z] = !0, U[a] = U[l] = U[q] = U[c] = U[M] = U[u] = U[h] = U[m] = U[y] = U[w] = U[A] = U[B] = U[H] = U[j] = U[Y] = !1;
  var Ke = typeof Re == "object" && Re && Re.Object === Object && Re, p = typeof self == "object" && self && self.Object === Object && self, d = Ke || p || Function("return this")(), b = t && !t.nodeType && t, T = b && !0 && e && !e.nodeType && e, Q = T && T.exports === b, se = Q && Ke.process, le = function() {
    try {
      return se && se.binding && se.binding("util");
    } catch {
    }
  }(), ve = le && le.isTypedArray;
  function Se(g, v) {
    for (var R = -1, F = g == null ? 0 : g.length, ne = 0, V = []; ++R < F; ) {
      var ce = g[R];
      v(ce, R, g) && (V[ne++] = ce);
    }
    return V;
  }
  function lt(g, v) {
    for (var R = -1, F = v.length, ne = g.length; ++R < F; )
      g[ne + R] = v[R];
    return g;
  }
  function de(g, v) {
    for (var R = -1, F = g == null ? 0 : g.length; ++R < F; )
      if (v(g[R], R, g))
        return !0;
    return !1;
  }
  function Ge(g, v) {
    for (var R = -1, F = Array(g); ++R < g; )
      F[R] = v(R);
    return F;
  }
  function Ai(g) {
    return function(v) {
      return g(v);
    };
  }
  function ln(g, v) {
    return g.has(v);
  }
  function Er(g, v) {
    return g == null ? void 0 : g[v];
  }
  function cn(g) {
    var v = -1, R = Array(g.size);
    return g.forEach(function(F, ne) {
      R[++v] = [ne, F];
    }), R;
  }
  function td(g, v) {
    return function(R) {
      return g(v(R));
    };
  }
  function rd(g) {
    var v = -1, R = Array(g.size);
    return g.forEach(function(F) {
      R[++v] = F;
    }), R;
  }
  var nd = Array.prototype, id = Function.prototype, un = Object.prototype, bi = d["__core-js_shared__"], ko = id.toString, Je = un.hasOwnProperty, Mo = function() {
    var g = /[^.]+$/.exec(bi && bi.keys && bi.keys.IE_PROTO || "");
    return g ? "Symbol(src)_1." + g : "";
  }(), jo = un.toString, sd = RegExp(
    "^" + ko.call(Je).replace(G, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), Bo = Q ? d.Buffer : void 0, fn = d.Symbol, Ho = d.Uint8Array, qo = un.propertyIsEnumerable, od = nd.splice, Ct = fn ? fn.toStringTag : void 0, Go = Object.getOwnPropertySymbols, ad = Bo ? Bo.isBuffer : void 0, ld = td(Object.keys, Object), Oi = Vt(d, "DataView"), yr = Vt(d, "Map"), Ci = Vt(d, "Promise"), Ri = Vt(d, "Set"), Ii = Vt(d, "WeakMap"), vr = Vt(Object, "create"), cd = Nt(Oi), ud = Nt(yr), fd = Nt(Ci), dd = Nt(Ri), hd = Nt(Ii), Vo = fn ? fn.prototype : void 0, Ni = Vo ? Vo.valueOf : void 0;
  function Rt(g) {
    var v = -1, R = g == null ? 0 : g.length;
    for (this.clear(); ++v < R; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function pd() {
    this.__data__ = vr ? vr(null) : {}, this.size = 0;
  }
  function md(g) {
    var v = this.has(g) && delete this.__data__[g];
    return this.size -= v ? 1 : 0, v;
  }
  function gd(g) {
    var v = this.__data__;
    if (vr) {
      var R = v[g];
      return R === n ? void 0 : R;
    }
    return Je.call(v, g) ? v[g] : void 0;
  }
  function Ed(g) {
    var v = this.__data__;
    return vr ? v[g] !== void 0 : Je.call(v, g);
  }
  function yd(g, v) {
    var R = this.__data__;
    return this.size += this.has(g) ? 0 : 1, R[g] = vr && v === void 0 ? n : v, this;
  }
  Rt.prototype.clear = pd, Rt.prototype.delete = md, Rt.prototype.get = gd, Rt.prototype.has = Ed, Rt.prototype.set = yd;
  function tt(g) {
    var v = -1, R = g == null ? 0 : g.length;
    for (this.clear(); ++v < R; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function vd() {
    this.__data__ = [], this.size = 0;
  }
  function _d(g) {
    var v = this.__data__, R = hn(v, g);
    if (R < 0)
      return !1;
    var F = v.length - 1;
    return R == F ? v.pop() : od.call(v, R, 1), --this.size, !0;
  }
  function wd(g) {
    var v = this.__data__, R = hn(v, g);
    return R < 0 ? void 0 : v[R][1];
  }
  function Td(g) {
    return hn(this.__data__, g) > -1;
  }
  function Sd(g, v) {
    var R = this.__data__, F = hn(R, g);
    return F < 0 ? (++this.size, R.push([g, v])) : R[F][1] = v, this;
  }
  tt.prototype.clear = vd, tt.prototype.delete = _d, tt.prototype.get = wd, tt.prototype.has = Td, tt.prototype.set = Sd;
  function It(g) {
    var v = -1, R = g == null ? 0 : g.length;
    for (this.clear(); ++v < R; ) {
      var F = g[v];
      this.set(F[0], F[1]);
    }
  }
  function Ad() {
    this.size = 0, this.__data__ = {
      hash: new Rt(),
      map: new (yr || tt)(),
      string: new Rt()
    };
  }
  function bd(g) {
    var v = pn(this, g).delete(g);
    return this.size -= v ? 1 : 0, v;
  }
  function Od(g) {
    return pn(this, g).get(g);
  }
  function Cd(g) {
    return pn(this, g).has(g);
  }
  function Rd(g, v) {
    var R = pn(this, g), F = R.size;
    return R.set(g, v), this.size += R.size == F ? 0 : 1, this;
  }
  It.prototype.clear = Ad, It.prototype.delete = bd, It.prototype.get = Od, It.prototype.has = Cd, It.prototype.set = Rd;
  function dn(g) {
    var v = -1, R = g == null ? 0 : g.length;
    for (this.__data__ = new It(); ++v < R; )
      this.add(g[v]);
  }
  function Id(g) {
    return this.__data__.set(g, n), this;
  }
  function Nd(g) {
    return this.__data__.has(g);
  }
  dn.prototype.add = dn.prototype.push = Id, dn.prototype.has = Nd;
  function ct(g) {
    var v = this.__data__ = new tt(g);
    this.size = v.size;
  }
  function $d() {
    this.__data__ = new tt(), this.size = 0;
  }
  function Dd(g) {
    var v = this.__data__, R = v.delete(g);
    return this.size = v.size, R;
  }
  function Pd(g) {
    return this.__data__.get(g);
  }
  function Fd(g) {
    return this.__data__.has(g);
  }
  function Ld(g, v) {
    var R = this.__data__;
    if (R instanceof tt) {
      var F = R.__data__;
      if (!yr || F.length < r - 1)
        return F.push([g, v]), this.size = ++R.size, this;
      R = this.__data__ = new It(F);
    }
    return R.set(g, v), this.size = R.size, this;
  }
  ct.prototype.clear = $d, ct.prototype.delete = Dd, ct.prototype.get = Pd, ct.prototype.has = Fd, ct.prototype.set = Ld;
  function xd(g, v) {
    var R = mn(g), F = !R && Jd(g), ne = !R && !F && $i(g), V = !R && !F && !ne && ea(g), ce = R || F || ne || V, ge = ce ? Ge(g.length, String) : [], _e = ge.length;
    for (var oe in g)
      Je.call(g, oe) && !(ce && // Safari 9 has enumerable `arguments.length` in strict mode.
      (oe == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      ne && (oe == "offset" || oe == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      V && (oe == "buffer" || oe == "byteLength" || oe == "byteOffset") || // Skip index properties.
      Wd(oe, _e))) && ge.push(oe);
    return ge;
  }
  function hn(g, v) {
    for (var R = g.length; R--; )
      if (Ko(g[R][0], v))
        return R;
    return -1;
  }
  function Ud(g, v, R) {
    var F = v(g);
    return mn(g) ? F : lt(F, R(g));
  }
  function _r(g) {
    return g == null ? g === void 0 ? E : S : Ct && Ct in Object(g) ? Gd(g) : Kd(g);
  }
  function Wo(g) {
    return wr(g) && _r(g) == a;
  }
  function Yo(g, v, R, F, ne) {
    return g === v ? !0 : g == null || v == null || !wr(g) && !wr(v) ? g !== g && v !== v : kd(g, v, R, F, Yo, ne);
  }
  function kd(g, v, R, F, ne, V) {
    var ce = mn(g), ge = mn(v), _e = ce ? l : ut(g), oe = ge ? l : ut(v);
    _e = _e == a ? A : _e, oe = oe == a ? A : oe;
    var Me = _e == A, Ve = oe == A, Ae = _e == oe;
    if (Ae && $i(g)) {
      if (!$i(v))
        return !1;
      ce = !0, Me = !1;
    }
    if (Ae && !Me)
      return V || (V = new ct()), ce || ea(g) ? zo(g, v, R, F, ne, V) : Hd(g, v, _e, R, F, ne, V);
    if (!(R & i)) {
      var Be = Me && Je.call(g, "__wrapped__"), He = Ve && Je.call(v, "__wrapped__");
      if (Be || He) {
        var ft = Be ? g.value() : g, rt = He ? v.value() : v;
        return V || (V = new ct()), ne(ft, rt, R, F, V);
      }
    }
    return Ae ? (V || (V = new ct()), qd(g, v, R, F, ne, V)) : !1;
  }
  function Md(g) {
    if (!Zo(g) || zd(g))
      return !1;
    var v = Jo(g) ? sd : te;
    return v.test(Nt(g));
  }
  function jd(g) {
    return wr(g) && Qo(g.length) && !!U[_r(g)];
  }
  function Bd(g) {
    if (!Xd(g))
      return ld(g);
    var v = [];
    for (var R in Object(g))
      Je.call(g, R) && R != "constructor" && v.push(R);
    return v;
  }
  function zo(g, v, R, F, ne, V) {
    var ce = R & i, ge = g.length, _e = v.length;
    if (ge != _e && !(ce && _e > ge))
      return !1;
    var oe = V.get(g);
    if (oe && V.get(v))
      return oe == v;
    var Me = -1, Ve = !0, Ae = R & s ? new dn() : void 0;
    for (V.set(g, v), V.set(v, g); ++Me < ge; ) {
      var Be = g[Me], He = v[Me];
      if (F)
        var ft = ce ? F(He, Be, Me, v, g, V) : F(Be, He, Me, g, v, V);
      if (ft !== void 0) {
        if (ft)
          continue;
        Ve = !1;
        break;
      }
      if (Ae) {
        if (!de(v, function(rt, $t) {
          if (!ln(Ae, $t) && (Be === rt || ne(Be, rt, R, F, V)))
            return Ae.push($t);
        })) {
          Ve = !1;
          break;
        }
      } else if (!(Be === He || ne(Be, He, R, F, V))) {
        Ve = !1;
        break;
      }
    }
    return V.delete(g), V.delete(v), Ve;
  }
  function Hd(g, v, R, F, ne, V, ce) {
    switch (R) {
      case M:
        if (g.byteLength != v.byteLength || g.byteOffset != v.byteOffset)
          return !1;
        g = g.buffer, v = v.buffer;
      case q:
        return !(g.byteLength != v.byteLength || !V(new Ho(g), new Ho(v)));
      case c:
      case u:
      case w:
        return Ko(+g, +v);
      case h:
        return g.name == v.name && g.message == v.message;
      case B:
      case j:
        return g == v + "";
      case y:
        var ge = cn;
      case H:
        var _e = F & i;
        if (ge || (ge = rd), g.size != v.size && !_e)
          return !1;
        var oe = ce.get(g);
        if (oe)
          return oe == v;
        F |= s, ce.set(g, v);
        var Me = zo(ge(g), ge(v), F, ne, V, ce);
        return ce.delete(g), Me;
      case ue:
        if (Ni)
          return Ni.call(g) == Ni.call(v);
    }
    return !1;
  }
  function qd(g, v, R, F, ne, V) {
    var ce = R & i, ge = Xo(g), _e = ge.length, oe = Xo(v), Me = oe.length;
    if (_e != Me && !ce)
      return !1;
    for (var Ve = _e; Ve--; ) {
      var Ae = ge[Ve];
      if (!(ce ? Ae in v : Je.call(v, Ae)))
        return !1;
    }
    var Be = V.get(g);
    if (Be && V.get(v))
      return Be == v;
    var He = !0;
    V.set(g, v), V.set(v, g);
    for (var ft = ce; ++Ve < _e; ) {
      Ae = ge[Ve];
      var rt = g[Ae], $t = v[Ae];
      if (F)
        var ta = ce ? F($t, rt, Ae, v, g, V) : F(rt, $t, Ae, g, v, V);
      if (!(ta === void 0 ? rt === $t || ne(rt, $t, R, F, V) : ta)) {
        He = !1;
        break;
      }
      ft || (ft = Ae == "constructor");
    }
    if (He && !ft) {
      var gn = g.constructor, En = v.constructor;
      gn != En && "constructor" in g && "constructor" in v && !(typeof gn == "function" && gn instanceof gn && typeof En == "function" && En instanceof En) && (He = !1);
    }
    return V.delete(g), V.delete(v), He;
  }
  function Xo(g) {
    return Ud(g, eh, Vd);
  }
  function pn(g, v) {
    var R = g.__data__;
    return Yd(v) ? R[typeof v == "string" ? "string" : "hash"] : R.map;
  }
  function Vt(g, v) {
    var R = Er(g, v);
    return Md(R) ? R : void 0;
  }
  function Gd(g) {
    var v = Je.call(g, Ct), R = g[Ct];
    try {
      g[Ct] = void 0;
      var F = !0;
    } catch {
    }
    var ne = jo.call(g);
    return F && (v ? g[Ct] = R : delete g[Ct]), ne;
  }
  var Vd = Go ? function(g) {
    return g == null ? [] : (g = Object(g), Se(Go(g), function(v) {
      return qo.call(g, v);
    }));
  } : th, ut = _r;
  (Oi && ut(new Oi(new ArrayBuffer(1))) != M || yr && ut(new yr()) != y || Ci && ut(Ci.resolve()) != D || Ri && ut(new Ri()) != H || Ii && ut(new Ii()) != Y) && (ut = function(g) {
    var v = _r(g), R = v == A ? g.constructor : void 0, F = R ? Nt(R) : "";
    if (F)
      switch (F) {
        case cd:
          return M;
        case ud:
          return y;
        case fd:
          return D;
        case dd:
          return H;
        case hd:
          return Y;
      }
    return v;
  });
  function Wd(g, v) {
    return v = v ?? o, !!v && (typeof g == "number" || me.test(g)) && g > -1 && g % 1 == 0 && g < v;
  }
  function Yd(g) {
    var v = typeof g;
    return v == "string" || v == "number" || v == "symbol" || v == "boolean" ? g !== "__proto__" : g === null;
  }
  function zd(g) {
    return !!Mo && Mo in g;
  }
  function Xd(g) {
    var v = g && g.constructor, R = typeof v == "function" && v.prototype || un;
    return g === R;
  }
  function Kd(g) {
    return jo.call(g);
  }
  function Nt(g) {
    if (g != null) {
      try {
        return ko.call(g);
      } catch {
      }
      try {
        return g + "";
      } catch {
      }
    }
    return "";
  }
  function Ko(g, v) {
    return g === v || g !== g && v !== v;
  }
  var Jd = Wo(/* @__PURE__ */ function() {
    return arguments;
  }()) ? Wo : function(g) {
    return wr(g) && Je.call(g, "callee") && !qo.call(g, "callee");
  }, mn = Array.isArray;
  function Qd(g) {
    return g != null && Qo(g.length) && !Jo(g);
  }
  var $i = ad || rh;
  function Zd(g, v) {
    return Yo(g, v);
  }
  function Jo(g) {
    if (!Zo(g))
      return !1;
    var v = _r(g);
    return v == m || v == _ || v == f || v == L;
  }
  function Qo(g) {
    return typeof g == "number" && g > -1 && g % 1 == 0 && g <= o;
  }
  function Zo(g) {
    var v = typeof g;
    return g != null && (v == "object" || v == "function");
  }
  function wr(g) {
    return g != null && typeof g == "object";
  }
  var ea = ve ? Ai(ve) : jd;
  function eh(g) {
    return Qd(g) ? xd(g) : Bd(g);
  }
  function th() {
    return [];
  }
  function rh() {
    return !1;
  }
  e.exports = Zd;
})(Jn, Jn.exports);
var ew = Jn.exports;
Object.defineProperty(nn, "__esModule", { value: !0 });
nn.DownloadedUpdateHelper = void 0;
nn.createTempUpdateFile = sw;
const tw = fr, rw = $e, pl = ew, Pt = bt, Dr = Z;
class nw {
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
    return Dr.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, r, n, i) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return pl(this.versionInfo, r) && pl(this.fileInfo.info, n.info) && await (0, Pt.pathExists)(t) ? t : null;
    const s = await this.getValidCachedUpdateFile(n, i);
    return s === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = s, s);
  }
  async setDownloadedFile(t, r, n, i, s, o) {
    this._file = t, this._packageFile = r, this.versionInfo = n, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: s,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, o && await (0, Pt.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
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
    let s;
    try {
      s = await (0, Pt.readJson)(n);
    } catch (f) {
      let c = "No cached update info available";
      return f.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), c += ` (error on read: ${f.message})`), r.info(c), null;
    }
    if (!((s == null ? void 0 : s.fileName) !== null))
      return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== s.sha512)
      return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${s.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const a = Dr.join(this.cacheDirForPendingUpdate, s.fileName);
    if (!await (0, Pt.pathExists)(a))
      return r.info("Cached update file doesn't exist"), null;
    const l = await iw(a);
    return t.info.sha512 !== l ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${l}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = s, a);
  }
  getUpdateInfoFile() {
    return Dr.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
nn.DownloadedUpdateHelper = nw;
function iw(e, t = "sha512", r = "base64", n) {
  return new Promise((i, s) => {
    const o = (0, tw.createHash)(t);
    o.on("error", s).setEncoding(r), (0, rw.createReadStream)(e, {
      ...n,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", s).on("end", () => {
      o.end(), i(o.read());
    }).pipe(o, { end: !1 });
  });
}
async function sw(e, t, r) {
  let n = 0, i = Dr.join(t, e);
  for (let s = 0; s < 3; s++)
    try {
      return await (0, Pt.unlink)(i), i;
    } catch (o) {
      if (o.code === "ENOENT")
        return i;
      r.warn(`Error on remove temp update file: ${o}`), i = Dr.join(t, `${n++}-${e}`);
    }
  return i;
}
var mi = {}, Po = {};
Object.defineProperty(Po, "__esModule", { value: !0 });
Po.getAppCacheDir = aw;
const Xi = Z, ow = st;
function aw() {
  const e = (0, ow.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || Xi.join(e, "AppData", "Local") : process.platform === "darwin" ? t = Xi.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || Xi.join(e, ".cache"), t;
}
Object.defineProperty(mi, "__esModule", { value: !0 });
mi.ElectronAppAdapter = void 0;
const ml = Z, lw = Po;
class cw {
  constructor(t = yt.app) {
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
    return this.isPackaged ? ml.join(process.resourcesPath, "app-update.yml") : ml.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, lw.getAppCacheDir)();
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
mi.ElectronAppAdapter = cw;
var $f = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
  const t = ye;
  e.NET_SESSION_NAME = "electron-updater";
  function r() {
    return yt.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class n extends t.HttpExecutor {
    constructor(s) {
      super(), this.proxyLoginCallback = s, this.cachedSession = null;
    }
    async download(s, o, a) {
      return await a.cancellationToken.createPromise((l, f, c) => {
        const u = {
          headers: a.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(s, u), (0, t.configureRequestOptions)(u), this.doDownload(u, {
          destination: o,
          options: a,
          onCancel: c,
          callback: (h) => {
            h == null ? l(o) : f(h);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(s, o) {
      s.headers && s.headers.Host && (s.host = s.headers.Host, delete s.headers.Host), this.cachedSession == null && (this.cachedSession = r());
      const a = yt.net.request({
        ...s,
        session: this.cachedSession
      });
      return a.on("response", o), this.proxyLoginCallback != null && a.on("login", this.proxyLoginCallback), a;
    }
    addRedirectHandlers(s, o, a, l, f) {
      s.on("redirect", (c, u, h) => {
        s.abort(), l > this.maxRedirects ? a(this.createMaxRedirectError()) : f(t.HttpExecutor.prepareRedirectUrlOptions(h, o));
      });
    }
  }
  e.ElectronHttpExecutor = n;
})($f);
var sn = {}, qe = {}, uw = "[object Symbol]", Df = /[\\^$.*+?()[\]{}|]/g, fw = RegExp(Df.source), dw = typeof Re == "object" && Re && Re.Object === Object && Re, hw = typeof self == "object" && self && self.Object === Object && self, pw = dw || hw || Function("return this")(), mw = Object.prototype, gw = mw.toString, gl = pw.Symbol, El = gl ? gl.prototype : void 0, yl = El ? El.toString : void 0;
function Ew(e) {
  if (typeof e == "string")
    return e;
  if (vw(e))
    return yl ? yl.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function yw(e) {
  return !!e && typeof e == "object";
}
function vw(e) {
  return typeof e == "symbol" || yw(e) && gw.call(e) == uw;
}
function _w(e) {
  return e == null ? "" : Ew(e);
}
function ww(e) {
  return e = _w(e), e && fw.test(e) ? e.replace(Df, "\\$&") : e;
}
var Tw = ww;
Object.defineProperty(qe, "__esModule", { value: !0 });
qe.newBaseUrl = Aw;
qe.newUrlFromBase = Xs;
qe.getChannelFilename = bw;
qe.blockmapFiles = Ow;
const Pf = dr, Sw = Tw;
function Aw(e) {
  const t = new Pf.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function Xs(e, t, r = !1) {
  const n = new Pf.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? n.search = i : r && (n.search = `noCache=${Date.now().toString(32)}`), n;
}
function bw(e) {
  return `${e}.yml`;
}
function Ow(e, t, r) {
  const n = Xs(`${e.pathname}.blockmap`, e);
  return [Xs(`${e.pathname.replace(new RegExp(Sw(r), "g"), t)}.blockmap`, e), n];
}
var pe = {};
Object.defineProperty(pe, "__esModule", { value: !0 });
pe.Provider = void 0;
pe.findFile = Iw;
pe.parseUpdateInfo = Nw;
pe.getFileList = Ff;
pe.resolveFiles = $w;
const St = ye, Cw = Te, vl = qe;
class Rw {
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
pe.Provider = Rw;
function Iw(e, t, r) {
  if (e.length === 0)
    throw (0, St.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const n = e.find((i) => i.url.pathname.toLowerCase().endsWith(`.${t}`));
  return n ?? (r == null ? e[0] : e.find((i) => !r.some((s) => i.url.pathname.toLowerCase().endsWith(`.${s}`))));
}
function Nw(e, t, r) {
  if (e == null)
    throw (0, St.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let n;
  try {
    n = (0, Cw.load)(e);
  } catch (i) {
    throw (0, St.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return n;
}
function Ff(e) {
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
function $w(e, t, r = (n) => n) {
  const i = Ff(e).map((a) => {
    if (a.sha2 == null && a.sha512 == null)
      throw (0, St.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, St.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, vl.newUrlFromBase)(r(a.url), t),
      info: a
    };
  }), s = e.packages, o = s == null ? null : s[process.arch] || s.ia32;
  return o != null && (i[0].packageInfo = {
    ...o,
    path: (0, vl.newUrlFromBase)(r(o.path), t).href
  }), i;
}
Object.defineProperty(sn, "__esModule", { value: !0 });
sn.GenericProvider = void 0;
const _l = ye, Ki = qe, Ji = pe;
class Dw extends Ji.Provider {
  constructor(t, r, n) {
    super(n), this.configuration = t, this.updater = r, this.baseUrl = (0, Ki.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, Ki.getChannelFilename)(this.channel), r = (0, Ki.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let n = 0; ; n++)
      try {
        return (0, Ji.parseUpdateInfo)(await this.httpRequest(r), t, r);
      } catch (i) {
        if (i instanceof _l.HttpError && i.statusCode === 404)
          throw (0, _l.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (i.code === "ECONNREFUSED" && n < 3) {
          await new Promise((s, o) => {
            try {
              setTimeout(s, 1e3 * n);
            } catch (a) {
              o(a);
            }
          });
          continue;
        }
        throw i;
      }
  }
  resolveFiles(t) {
    return (0, Ji.resolveFiles)(t, this.baseUrl);
  }
}
sn.GenericProvider = Dw;
var gi = {}, Ei = {};
Object.defineProperty(Ei, "__esModule", { value: !0 });
Ei.BitbucketProvider = void 0;
const wl = ye, Qi = qe, Zi = pe;
class Pw extends Zi.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r;
    const { owner: i, slug: s } = t;
    this.baseUrl = (0, Qi.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${s}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new wl.CancellationToken(), r = (0, Qi.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, Qi.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, void 0, t);
      return (0, Zi.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, wl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Zi.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: r } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${r}, channel: ${this.channel})`;
  }
}
Ei.BitbucketProvider = Pw;
var At = {};
Object.defineProperty(At, "__esModule", { value: !0 });
At.GitHubProvider = At.BaseGitHubProvider = void 0;
At.computeReleaseNotes = xf;
const nt = ye, rr = Nf, Fw = dr, nr = qe, Ks = pe, es = /\/tag\/([^/]+)$/;
class Lf extends Ks.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, nr.newBaseUrl)((0, nt.githubUrl)(t, r));
    const i = r === "github.com" ? "api.github.com" : r;
    this.baseApiUrl = (0, nr.newBaseUrl)((0, nt.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const r = this.options.host;
    return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${t}` : t;
  }
}
At.BaseGitHubProvider = Lf;
class Lw extends Lf {
  constructor(t, r, n) {
    super(t, "github.com", n), this.options = t, this.updater = r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, r, n, i, s;
    const o = new nt.CancellationToken(), a = await this.httpRequest((0, nr.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, o), l = (0, nt.parseXml)(a);
    let f = l.element("entry", !1, "No published versions on GitHub"), c = null;
    try {
      if (this.updater.allowPrerelease) {
        const w = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((r = rr.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
        if (w === null)
          c = es.exec(f.element("link").attribute("href"))[1];
        else
          for (const S of l.getElements("entry")) {
            const A = es.exec(S.element("link").attribute("href"));
            if (A === null)
              continue;
            const D = A[1], L = ((n = rr.prerelease(D)) === null || n === void 0 ? void 0 : n[0]) || null, B = !w || ["alpha", "beta"].includes(w), H = L !== null && !["alpha", "beta"].includes(String(L));
            if (B && !H && !(w === "beta" && L === "alpha")) {
              c = D;
              break;
            }
            if (L && L === w) {
              c = D;
              break;
            }
          }
      } else {
        c = await this.getLatestTagName(o);
        for (const w of l.getElements("entry"))
          if (es.exec(w.element("link").attribute("href"))[1] === c) {
            f = w;
            break;
          }
      }
    } catch (w) {
      throw (0, nt.newError)(`Cannot parse releases feed: ${w.stack || w.message},
XML:
${a}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (c == null)
      throw (0, nt.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let u, h = "", m = "";
    const _ = async (w) => {
      h = (0, nr.getChannelFilename)(w), m = (0, nr.newUrlFromBase)(this.getBaseDownloadPath(String(c), h), this.baseUrl);
      const S = this.createRequestOptions(m);
      try {
        return await this.executor.request(S, o);
      } catch (A) {
        throw A instanceof nt.HttpError && A.statusCode === 404 ? (0, nt.newError)(`Cannot find ${h} in the latest release artifacts (${m}): ${A.stack || A.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : A;
      }
    };
    try {
      let w = this.channel;
      this.updater.allowPrerelease && (!((i = rr.prerelease(c)) === null || i === void 0) && i[0]) && (w = this.getCustomChannelName(String((s = rr.prerelease(c)) === null || s === void 0 ? void 0 : s[0]))), u = await _(w);
    } catch (w) {
      if (this.updater.allowPrerelease)
        u = await _(this.getDefaultChannelName());
      else
        throw w;
    }
    const y = (0, Ks.parseUpdateInfo)(u, h, m);
    return y.releaseName == null && (y.releaseName = f.elementValueOrEmpty("title")), y.releaseNotes == null && (y.releaseNotes = xf(this.updater.currentVersion, this.updater.fullChangelog, l, f)), {
      tag: c,
      ...y
    };
  }
  async getLatestTagName(t) {
    const r = this.options, n = r.host == null || r.host === "github.com" ? (0, nr.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new Fw.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
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
    return (0, Ks.resolveFiles)(t, this.baseUrl, (r) => this.getBaseDownloadPath(t.tag, r.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, r) {
    return `${this.basePath}/download/${t}/${r}`;
  }
}
At.GitHubProvider = Lw;
function Tl(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function xf(e, t, r, n) {
  if (!t)
    return Tl(n);
  const i = [];
  for (const s of r.getElements("entry")) {
    const o = /\/tag\/v?([^/]+)$/.exec(s.element("link").attribute("href"))[1];
    rr.lt(e, o) && i.push({
      version: o,
      note: Tl(s)
    });
  }
  return i.sort((s, o) => rr.rcompare(s.version, o.version));
}
var yi = {};
Object.defineProperty(yi, "__esModule", { value: !0 });
yi.KeygenProvider = void 0;
const Sl = ye, ts = qe, rs = pe;
class xw extends rs.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, ts.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new Sl.CancellationToken(), r = (0, ts.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, ts.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, rs.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, Sl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, rs.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: r, platform: n } = this.configuration;
    return `Keygen (account: ${t}, product: ${r}, platform: ${n}, channel: ${this.channel})`;
  }
}
yi.KeygenProvider = xw;
var vi = {};
Object.defineProperty(vi, "__esModule", { value: !0 });
vi.PrivateGitHubProvider = void 0;
const Xt = ye, Uw = Te, kw = Z, Al = dr, bl = qe, Mw = At, jw = pe;
class Bw extends Mw.BaseGitHubProvider {
  constructor(t, r, n, i) {
    super(t, "api.github.com", i), this.updater = r, this.token = n;
  }
  createRequestOptions(t, r) {
    const n = super.createRequestOptions(t, r);
    return n.redirect = "manual", n;
  }
  async getLatestVersion() {
    const t = new Xt.CancellationToken(), r = (0, bl.getChannelFilename)(this.getDefaultChannelName()), n = await this.getLatestVersionInfo(t), i = n.assets.find((a) => a.name === r);
    if (i == null)
      throw (0, Xt.newError)(`Cannot find ${r} in the release ${n.html_url || n.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const s = new Al.URL(i.url);
    let o;
    try {
      o = (0, Uw.load)(await this.httpRequest(s, this.configureHeaders("application/octet-stream"), t));
    } catch (a) {
      throw a instanceof Xt.HttpError && a.statusCode === 404 ? (0, Xt.newError)(`Cannot find ${r} in the latest release artifacts (${s}): ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : a;
    }
    return o.assets = n.assets, o;
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
    const i = (0, bl.newUrlFromBase)(n, this.baseUrl);
    try {
      const s = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      return r ? s.find((o) => o.prerelease) || s[0] : s;
    } catch (s) {
      throw (0, Xt.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${s.stack || s.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, jw.getFileList)(t).map((r) => {
      const n = kw.posix.basename(r.url).replace(/ /g, "-"), i = t.assets.find((s) => s != null && s.name === n);
      if (i == null)
        throw (0, Xt.newError)(`Cannot find asset "${n}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new Al.URL(i.url),
        info: r
      };
    });
  }
}
vi.PrivateGitHubProvider = Bw;
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.isUrlProbablySupportMultiRangeRequests = Uf;
gi.createClient = Ww;
const Nn = ye, Hw = Ei, Ol = sn, qw = At, Gw = yi, Vw = vi;
function Uf(e) {
  return !e.includes("s3.amazonaws.com");
}
function Ww(e, t, r) {
  if (typeof e == "string")
    throw (0, Nn.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const n = e.provider;
  switch (n) {
    case "github": {
      const i = e, s = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return s == null ? new qw.GitHubProvider(i, t, r) : new Vw.PrivateGitHubProvider(i, t, s, r);
    }
    case "bitbucket":
      return new Hw.BitbucketProvider(e, t, r);
    case "keygen":
      return new Gw.KeygenProvider(e, t, r);
    case "s3":
    case "spaces":
      return new Ol.GenericProvider({
        provider: "generic",
        url: (0, Nn.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...r,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new Ol.GenericProvider(i, t, {
        ...r,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && Uf(i.url)
      });
    }
    case "custom": {
      const i = e, s = i.updateProvider;
      if (!s)
        throw (0, Nn.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new s(i, t, r);
    }
    default:
      throw (0, Nn.newError)(`Unsupported provider: ${n}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var _i = {}, on = {}, gr = {}, qt = {};
Object.defineProperty(qt, "__esModule", { value: !0 });
qt.OperationKind = void 0;
qt.computeOperations = Yw;
var xt;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(xt || (qt.OperationKind = xt = {}));
function Yw(e, t, r) {
  const n = Rl(e.files), i = Rl(t.files);
  let s = null;
  const o = t.files[0], a = [], l = o.name, f = n.get(l);
  if (f == null)
    throw new Error(`no file ${l} in old blockmap`);
  const c = i.get(l);
  let u = 0;
  const { checksumToOffset: h, checksumToOldSize: m } = Xw(n.get(l), f.offset, r);
  let _ = o.offset;
  for (let y = 0; y < c.checksums.length; _ += c.sizes[y], y++) {
    const w = c.sizes[y], S = c.checksums[y];
    let A = h.get(S);
    A != null && m.get(S) !== w && (r.warn(`Checksum ("${S}") matches, but size differs (old: ${m.get(S)}, new: ${w})`), A = void 0), A === void 0 ? (u++, s != null && s.kind === xt.DOWNLOAD && s.end === _ ? s.end += w : (s = {
      kind: xt.DOWNLOAD,
      start: _,
      end: _ + w
      // oldBlocks: null,
    }, Cl(s, a, S, y))) : s != null && s.kind === xt.COPY && s.end === A ? s.end += w : (s = {
      kind: xt.COPY,
      start: A,
      end: A + w
      // oldBlocks: [checksum]
    }, Cl(s, a, S, y));
  }
  return u > 0 && r.info(`File${o.name === "file" ? "" : " " + o.name} has ${u} changed blocks`), a;
}
const zw = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function Cl(e, t, r, n) {
  if (zw && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const s = [i.start, i.end, e.start, e.end].reduce((o, a) => o < a ? o : a);
      throw new Error(`operation (block index: ${n}, checksum: ${r}, kind: ${xt[e.kind]}) overlaps previous operation (checksum: ${r}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - s} until ${i.end - s} and ${e.start - s} until ${e.end - s}`);
    }
  }
  t.push(e);
}
function Xw(e, t, r) {
  const n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let s = t;
  for (let o = 0; o < e.checksums.length; o++) {
    const a = e.checksums[o], l = e.sizes[o], f = i.get(a);
    if (f === void 0)
      n.set(a, s), i.set(a, l);
    else if (r.debug != null) {
      const c = f === l ? "(same size)" : `(size: ${f}, this size: ${l})`;
      r.debug(`${a} duplicated in blockmap ${c}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    s += l;
  }
  return { checksumToOffset: n, checksumToOldSize: i };
}
function Rl(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    t.set(r.name, r);
  return t;
}
Object.defineProperty(gr, "__esModule", { value: !0 });
gr.DataSplitter = void 0;
gr.copyData = kf;
const $n = ye, Kw = $e, Jw = Xr, Qw = qt, Il = Buffer.from(`\r
\r
`);
var ht;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(ht || (ht = {}));
function kf(e, t, r, n, i) {
  const s = (0, Kw.createReadStream)("", {
    fd: r,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  s.on("error", n), s.once("end", i), s.pipe(t, {
    end: !1
  });
}
class Zw extends Jw.Writable {
  constructor(t, r, n, i, s, o) {
    super(), this.out = t, this.options = r, this.partIndexToTaskIndex = n, this.partIndexToLength = s, this.finishHandler = o, this.partIndex = -1, this.headerListBuffer = null, this.readState = ht.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
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
      if (this.readState === ht.HEADER) {
        const n = this.searchHeaderListEnd(t, r);
        if (n === -1)
          return;
        r = n, this.readState = ht.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === ht.BODY)
          this.readState = ht.INIT;
        else {
          this.partIndex++;
          let o = this.partIndexToTaskIndex.get(this.partIndex);
          if (o == null)
            if (this.isFinished)
              o = this.options.end;
            else
              throw (0, $n.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const a = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (a < o)
            await this.copyExistingData(a, o);
          else if (a > o)
            throw (0, $n.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (r = this.searchHeaderListEnd(t, r), r === -1) {
            this.readState = ht.HEADER;
            return;
          }
        }
        const n = this.partIndexToLength[this.partIndex], i = r + n, s = Math.min(i, t.length);
        if (await this.processPartStarted(t, r, s), this.remainingPartDataCount = n - (s - r), this.remainingPartDataCount > 0)
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
      const s = () => {
        if (t === r) {
          n();
          return;
        }
        const o = this.options.tasks[t];
        if (o.kind !== Qw.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        kf(o, this.out, this.options.oldFileFd, i, () => {
          t++, s();
        });
      };
      s();
    });
  }
  searchHeaderListEnd(t, r) {
    const n = t.indexOf(Il, r);
    if (n !== -1)
      return n + Il.length;
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
    return i.write(r === 0 && t.length === n ? t : t.slice(r, n)) ? Promise.resolve() : new Promise((s, o) => {
      i.on("error", o), i.once("drain", () => {
        i.removeListener("error", o), s();
      });
    });
  }
}
gr.DataSplitter = Zw;
var wi = {};
Object.defineProperty(wi, "__esModule", { value: !0 });
wi.executeTasksUsingMultipleRangeRequests = eT;
wi.checkIsRangesSupported = Qs;
const Js = ye, Nl = gr, $l = qt;
function eT(e, t, r, n, i) {
  const s = (o) => {
    if (o >= t.length) {
      e.fileMetadataBuffer != null && r.write(e.fileMetadataBuffer), r.end();
      return;
    }
    const a = o + 1e3;
    tT(e, {
      tasks: t,
      start: o,
      end: Math.min(t.length, a),
      oldFileFd: n
    }, r, () => s(a), i);
  };
  return s;
}
function tT(e, t, r, n, i) {
  let s = "bytes=", o = 0;
  const a = /* @__PURE__ */ new Map(), l = [];
  for (let u = t.start; u < t.end; u++) {
    const h = t.tasks[u];
    h.kind === $l.OperationKind.DOWNLOAD && (s += `${h.start}-${h.end - 1}, `, a.set(o, u), o++, l.push(h.end - h.start));
  }
  if (o <= 1) {
    const u = (h) => {
      if (h >= t.end) {
        n();
        return;
      }
      const m = t.tasks[h++];
      if (m.kind === $l.OperationKind.COPY)
        (0, Nl.copyData)(m, r, t.oldFileFd, i, () => u(h));
      else {
        const _ = e.createRequestOptions();
        _.headers.Range = `bytes=${m.start}-${m.end - 1}`;
        const y = e.httpExecutor.createRequest(_, (w) => {
          Qs(w, i) && (w.pipe(r, {
            end: !1
          }), w.once("end", () => u(h)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(y, i), y.end();
      }
    };
    u(t.start);
    return;
  }
  const f = e.createRequestOptions();
  f.headers.Range = s.substring(0, s.length - 2);
  const c = e.httpExecutor.createRequest(f, (u) => {
    if (!Qs(u, i))
      return;
    const h = (0, Js.safeGetHeader)(u, "content-type"), m = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(h);
    if (m == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${h}"`));
      return;
    }
    const _ = new Nl.DataSplitter(r, t, a, m[1] || m[2], l, n);
    _.on("error", i), u.pipe(_), u.on("end", () => {
      setTimeout(() => {
        c.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(c, i), c.end();
}
function Qs(e, t) {
  if (e.statusCode >= 400)
    return t((0, Js.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const r = (0, Js.safeGetHeader)(e, "accept-ranges");
    if (r == null || r === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var Ti = {};
Object.defineProperty(Ti, "__esModule", { value: !0 });
Ti.ProgressDifferentialDownloadCallbackTransform = void 0;
const rT = Xr;
var ir;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(ir || (ir = {}));
class nT extends rT.Transform {
  constructor(t, r, n) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = ir.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == ir.COPY) {
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
    this.operationType = ir.COPY;
  }
  beginRangeDownload() {
    this.operationType = ir.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
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
Ti.ProgressDifferentialDownloadCallbackTransform = nT;
Object.defineProperty(on, "__esModule", { value: !0 });
on.DifferentialDownloader = void 0;
const br = ye, ns = bt, iT = $e, sT = gr, oT = dr, Dn = qt, Dl = wi, aT = Ti;
class lT {
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
    return (0, br.configureRequestUrl)(this.options.newUrl, t), (0, br.configureRequestOptions)(t), t;
  }
  doDownload(t, r) {
    if (t.version !== r.version)
      throw new Error(`version is different (${t.version} - ${r.version}), full download is required`);
    const n = this.logger, i = (0, Dn.computeOperations)(t, r, n);
    n.debug != null && n.debug(JSON.stringify(i, null, 2));
    let s = 0, o = 0;
    for (const l of i) {
      const f = l.end - l.start;
      l.kind === Dn.OperationKind.DOWNLOAD ? s += f : o += f;
    }
    const a = this.blockAwareFileInfo.size;
    if (s + o + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== a)
      throw new Error(`Internal error, size mismatch: downloadSize: ${s}, copySize: ${o}, newSize: ${a}`);
    return n.info(`Full: ${Pl(a)}, To download: ${Pl(s)} (${Math.round(s / (a / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const r = [], n = () => Promise.all(r.map((i) => (0, ns.close)(i.descriptor).catch((s) => {
      this.logger.error(`cannot close file "${i.path}": ${s}`);
    })));
    return this.doDownloadFile(t, r).then(n).catch((i) => n().catch((s) => {
      try {
        this.logger.error(`cannot close files: ${s}`);
      } catch (o) {
        try {
          console.error(o);
        } catch {
        }
      }
      throw i;
    }).then(() => {
      throw i;
    }));
  }
  async doDownloadFile(t, r) {
    const n = await (0, ns.open)(this.options.oldFile, "r");
    r.push({ descriptor: n, path: this.options.oldFile });
    const i = await (0, ns.open)(this.options.newFile, "w");
    r.push({ descriptor: i, path: this.options.newFile });
    const s = (0, iT.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((o, a) => {
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
        f = new aT.ProgressDifferentialDownloadCallbackTransform(D, this.options.cancellationToken, this.options.onProgress), l.push(f);
      }
      const c = new br.DigestTransform(this.blockAwareFileInfo.sha512);
      c.isValidateOnEnd = !1, l.push(c), s.on("finish", () => {
        s.close(() => {
          r.splice(1, 1);
          try {
            c.validate();
          } catch (S) {
            a(S);
            return;
          }
          o(void 0);
        });
      }), l.push(s);
      let u = null;
      for (const S of l)
        S.on("error", a), u == null ? u = S : u = u.pipe(S);
      const h = l[0];
      let m;
      if (this.options.isUseMultipleRangeRequest) {
        m = (0, Dl.executeTasksUsingMultipleRangeRequests)(this, t, h, n, a), m(0);
        return;
      }
      let _ = 0, y = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const w = this.createRequestOptions();
      w.redirect = "manual", m = (S) => {
        var A, D;
        if (S >= t.length) {
          this.fileMetadataBuffer != null && h.write(this.fileMetadataBuffer), h.end();
          return;
        }
        const L = t[S++];
        if (L.kind === Dn.OperationKind.COPY) {
          f && f.beginFileCopy(), (0, sT.copyData)(L, h, n, a, () => m(S));
          return;
        }
        const B = `bytes=${L.start}-${L.end - 1}`;
        w.headers.range = B, (D = (A = this.logger) === null || A === void 0 ? void 0 : A.debug) === null || D === void 0 || D.call(A, `download range: ${B}`), f && f.beginRangeDownload();
        const H = this.httpExecutor.createRequest(w, (j) => {
          j.on("error", a), j.on("aborted", () => {
            a(new Error("response has been aborted by the server"));
          }), j.statusCode >= 400 && a((0, br.createHttpError)(j)), j.pipe(h, {
            end: !1
          }), j.once("end", () => {
            f && f.endRangeDownload(), ++_ === 100 ? (_ = 0, setTimeout(() => m(S), 1e3)) : m(S);
          });
        });
        H.on("redirect", (j, ue, E) => {
          this.logger.info(`Redirect to ${cT(E)}`), y = E, (0, br.configureRequestUrl)(new oT.URL(y), w), H.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(H, a), H.end();
      }, m(0);
    });
  }
  async readRemoteBytes(t, r) {
    const n = Buffer.allocUnsafe(r + 1 - t), i = this.createRequestOptions();
    i.headers.range = `bytes=${t}-${r}`;
    let s = 0;
    if (await this.request(i, (o) => {
      o.copy(n, s), s += o.length;
    }), s !== n.length)
      throw new Error(`Received data length ${s} is not equal to expected ${n.length}`);
    return n;
  }
  request(t, r) {
    return new Promise((n, i) => {
      const s = this.httpExecutor.createRequest(t, (o) => {
        (0, Dl.checkIsRangesSupported)(o, i) && (o.on("error", i), o.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), o.on("data", r), o.on("end", () => n()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(s, i), s.end();
    });
  }
}
on.DifferentialDownloader = lT;
function Pl(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function cT(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(_i, "__esModule", { value: !0 });
_i.GenericDifferentialDownloader = void 0;
const uT = on;
class fT extends uT.DifferentialDownloader {
  download(t, r) {
    return this.doDownload(t, r);
  }
}
_i.GenericDifferentialDownloader = fT;
var Ot = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
  const t = ye;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class r {
    constructor(s) {
      this.emitter = s;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(s) {
      n(this.emitter, "login", s);
    }
    progress(s) {
      n(this.emitter, e.DOWNLOAD_PROGRESS, s);
    }
    updateDownloaded(s) {
      n(this.emitter, e.UPDATE_DOWNLOADED, s);
    }
    updateCancelled(s) {
      n(this.emitter, "update-cancelled", s);
    }
  }
  e.UpdaterSignal = r;
  function n(i, s, o) {
    i.on(s, o);
  }
})(Ot);
Object.defineProperty(_t, "__esModule", { value: !0 });
_t.NoOpLogger = _t.AppUpdater = void 0;
const Ce = ye, dT = fr, hT = st, pT = ei, Kt = bt, mT = Te, is = ci, Dt = Z, Ft = Nf, Fl = nn, gT = mi, Ll = $f, ET = sn, ss = gi, yT = Nc, vT = qe, _T = _i, Jt = Ot;
class Fo extends pT.EventEmitter {
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
        throw (0, Ce.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, Ce.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
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
    return (0, Ll.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new Mf();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new is.Lazy(() => this.loadUpdateConfig());
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
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new Jt.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (s) => this.checkIfUpdateSupported(s), this.clientPromise = null, this.stagingUserIdPromise = new is.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new is.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (s) => {
      this._logger.error(`Error: ${s.stack || s.message}`);
    }), r == null ? (this.app = new gT.ElectronAppAdapter(), this.httpExecutor = new Ll.ElectronHttpExecutor((s, o) => this.emit("login", s, o))) : (this.app = r, this.httpExecutor = null);
    const n = this.app.version, i = (0, Ft.parse)(n);
    if (i == null)
      throw (0, Ce.newError)(`App version is not a valid semver version: "${n}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = wT(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
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
    typeof t == "string" ? n = new ET.GenericProvider({ provider: "generic", url: t }, this, {
      ...r,
      isUseMultipleRangeRequest: (0, ss.isUrlProbablySupportMultiRangeRequests)(t)
    }) : n = (0, ss.createClient)(t, this, r), this.clientPromise = Promise.resolve(n);
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
      const n = Fo.formatDownloadNotification(r.updateInfo.version, this.app.name, t);
      new yt.Notification(n).show();
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
    const i = await this.stagingUserIdPromise.value, o = Ce.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${n}, percentage: ${o}, user id: ${i}`), o < n;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const r = (0, Ft.parse)(t.version);
    if (r == null)
      throw (0, Ce.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const n = this.currentVersion;
    if ((0, Ft.eq)(r, n) || !await Promise.resolve(this.isUpdateSupported(t)) || !await this.isStagingMatch(t))
      return !1;
    const s = (0, Ft.gt)(r, n), o = (0, Ft.lt)(r, n);
    return s ? !0 : this.allowDowngrade && o;
  }
  checkIfUpdateSupported(t) {
    const r = t == null ? void 0 : t.minimumSystemVersion, n = (0, hT.release)();
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
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((n) => (0, ss.createClient)(n, this, this.createProviderRuntimeOptions())));
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
    const n = new Ce.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: r,
      updateInfo: r,
      cancellationToken: n,
      downloadPromise: this.autoDownload ? this.downloadUpdate(n) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, Ce.asArray)(t.files).map((r) => r.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new Ce.CancellationToken()) {
    const r = this.updateInfoAndProvider;
    if (r == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, Ce.asArray)(r.info.files).map((i) => i.url).join(", ")}`);
    const n = (i) => {
      if (!(i instanceof Ce.CancellationError))
        try {
          this.dispatchError(i);
        } catch (s) {
          this._logger.warn(`Cannot dispatch error event: ${s.stack || s}`);
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
    this.emit(Jt.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, mT.load)(await (0, Kt.readFile)(this._appUpdateConfigPath, "utf-8"));
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
      const n = await (0, Kt.readFile)(t, "utf-8");
      if (Ce.UUID.check(n))
        return n;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${n}`);
    } catch (n) {
      n.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${n}`);
    }
    const r = Ce.UUID.v5((0, dT.randomBytes)(4096), Ce.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${r}`);
    try {
      await (0, Kt.outputFile)(t, r);
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
      n.debug != null && n.debug(`updater cache dir: ${i}`), t = new Fl.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
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
    this.listenerCount(Jt.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (A) => this.emit(Jt.DOWNLOAD_PROGRESS, A));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, s = i.version, o = r.packageInfo;
    function a() {
      const A = decodeURIComponent(t.fileInfo.url.pathname);
      return A.endsWith(`.${t.fileExtension}`) ? Dt.basename(A) : t.fileInfo.info.url;
    }
    const l = await this.getOrCreateDownloadHelper(), f = l.cacheDirForPendingUpdate;
    await (0, Kt.mkdir)(f, { recursive: !0 });
    const c = a();
    let u = Dt.join(f, c);
    const h = o == null ? null : Dt.join(f, `package-${s}${Dt.extname(o.path) || ".7z"}`), m = async (A) => (await l.setDownloadedFile(u, h, i, r, c, A), await t.done({
      ...i,
      downloadedFile: u
    }), h == null ? [u] : [u, h]), _ = this._logger, y = await l.validateDownloadedPath(u, i, r, _);
    if (y != null)
      return u = y, await m(!1);
    const w = async () => (await l.clear().catch(() => {
    }), await (0, Kt.unlink)(u).catch(() => {
    })), S = await (0, Fl.createTempUpdateFile)(`temp-${c}`, f, _);
    try {
      await t.task(S, n, h, w), await (0, Ce.retry)(() => (0, Kt.rename)(S, u), 60, 500, 0, 0, (A) => A instanceof Error && /^EBUSY:/.test(A.message));
    } catch (A) {
      throw await w(), A instanceof Ce.CancellationError && (_.info("cancelled"), this.emit("update-cancelled", i)), A;
    }
    return _.info(`New version ${s} has been downloaded to ${u}`), await m(!0);
  }
  async differentialDownloadInstaller(t, r, n, i, s) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const o = (0, vT.blockmapFiles)(t.url, this.app.version, r.updateInfoAndProvider.info.version);
      this._logger.info(`Download block maps (old: "${o[0]}", new: ${o[1]})`);
      const a = async (c) => {
        const u = await this.httpExecutor.downloadToBuffer(c, {
          headers: r.requestHeaders,
          cancellationToken: r.cancellationToken
        });
        if (u == null || u.length === 0)
          throw new Error(`Blockmap "${c.href}" is empty`);
        try {
          return JSON.parse((0, yT.gunzipSync)(u).toString());
        } catch (h) {
          throw new Error(`Cannot parse blockmap "${c.href}", error: ${h}`);
        }
      }, l = {
        newUrl: t.url,
        oldFile: Dt.join(this.downloadedUpdateHelper.cacheDir, s),
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: r.requestHeaders,
        cancellationToken: r.cancellationToken
      };
      this.listenerCount(Jt.DOWNLOAD_PROGRESS) > 0 && (l.onProgress = (c) => this.emit(Jt.DOWNLOAD_PROGRESS, c));
      const f = await Promise.all(o.map((c) => a(c)));
      return await new _T.GenericDifferentialDownloader(t.info, this.httpExecutor, l).download(f[0], f[1]), !1;
    } catch (o) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), this._testOnlyOptions != null)
        throw o;
      return !0;
    }
  }
}
_t.AppUpdater = Fo;
function wT(e) {
  const t = (0, Ft.prerelease)(e);
  return t != null && t.length > 0;
}
class Mf {
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
_t.NoOpLogger = Mf;
Object.defineProperty(ot, "__esModule", { value: !0 });
ot.BaseUpdater = void 0;
const xl = Kr, TT = _t;
class ST extends TT.AppUpdater {
  constructor(t, r) {
    super(t, r), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, r = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? r : this.autoRunAppAfterInstall) ? setImmediate(() => {
      yt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
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
    const n = this.downloadedUpdateHelper, i = this.installerPath, s = n == null ? null : n.downloadedFileInfo;
    if (i == null || s == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${r}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: r,
        isAdminRightsRequired: s.isAdminRightsRequired
      });
    } catch (o) {
      return this.dispatchError(o), !1;
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
    const i = (0, xl.spawnSync)(t, r, {
      env: { ...process.env, ...n },
      encoding: "utf-8",
      shell: !0
    }), { error: s, status: o, stdout: a, stderr: l } = i;
    if (s != null)
      throw this._logger.error(l), s;
    if (o != null && o !== 0)
      throw this._logger.error(l), new Error(`Command ${t} exited with code ${o}`);
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
    return this._logger.info(`Executing: ${t} with args: ${r}`), new Promise((s, o) => {
      try {
        const a = { stdio: i, env: n, detached: !0 }, l = (0, xl.spawn)(t, r, a);
        l.on("error", (f) => {
          o(f);
        }), l.unref(), l.pid !== void 0 && s(!0);
      } catch (a) {
        o(a);
      }
    });
  }
}
ot.BaseUpdater = ST;
var Hr = {}, an = {};
Object.defineProperty(an, "__esModule", { value: !0 });
an.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const Qt = bt, AT = on, bT = Nc;
class OT extends AT.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, r = t.size, n = r - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(n, r - 1);
    const i = jf(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await CT(this.options.oldFile), i);
  }
}
an.FileWithEmbeddedBlockMapDifferentialDownloader = OT;
function jf(e) {
  return JSON.parse((0, bT.inflateRawSync)(e).toString());
}
async function CT(e) {
  const t = await (0, Qt.open)(e, "r");
  try {
    const r = (await (0, Qt.fstat)(t)).size, n = Buffer.allocUnsafe(4);
    await (0, Qt.read)(t, n, 0, n.length, r - n.length);
    const i = Buffer.allocUnsafe(n.readUInt32BE(0));
    return await (0, Qt.read)(t, i, 0, i.length, r - n.length - i.length), await (0, Qt.close)(t), jf(i);
  } catch (r) {
    throw await (0, Qt.close)(t), r;
  }
}
Object.defineProperty(Hr, "__esModule", { value: !0 });
Hr.AppImageUpdater = void 0;
const Ul = ye, kl = Kr, RT = bt, IT = $e, Or = Z, NT = ot, $T = an, DT = pe, Ml = Ot;
class PT extends NT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, DT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        const o = process.env.APPIMAGE;
        if (o == null)
          throw (0, Ul.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(n, o, i, r, t)) && await this.httpExecutor.download(n.url, i, s), await (0, RT.chmod)(i, 493);
      }
    });
  }
  async downloadDifferential(t, r, n, i, s) {
    try {
      const o = {
        newUrl: t.url,
        oldFile: r,
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: s.requestHeaders,
        cancellationToken: s.cancellationToken
      };
      return this.listenerCount(Ml.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (a) => this.emit(Ml.DOWNLOAD_PROGRESS, a)), await new $T.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, o).download(), !1;
    } catch (o) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const r = process.env.APPIMAGE;
    if (r == null)
      throw (0, Ul.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, IT.unlinkSync)(r);
    let n;
    const i = Or.basename(r), s = this.installerPath;
    if (s == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    Or.basename(s) === i || !/\d+\.\d+\.\d+/.test(i) ? n = r : n = Or.join(Or.dirname(r), Or.basename(s)), (0, kl.execFileSync)("mv", ["-f", s, n]), n !== r && this.emit("appimage-filename-updated", n);
    const o = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(n, [], o) : (o.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, kl.execFileSync)(n, [], { env: o })), !0;
  }
}
Hr.AppImageUpdater = PT;
var qr = {};
Object.defineProperty(qr, "__esModule", { value: !0 });
qr.DebUpdater = void 0;
const FT = ot, LT = pe, jl = Ot;
class xT extends FT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, LT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        this.listenerCount(jl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (o) => this.emit(jl.DOWNLOAD_PROGRESS, o)), await this.httpExecutor.download(n.url, i, s);
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
    const s = ["dpkg", "-i", i, "||", "apt-get", "install", "-f", "-y"];
    return this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${s.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
qr.DebUpdater = xT;
var Gr = {};
Object.defineProperty(Gr, "__esModule", { value: !0 });
Gr.PacmanUpdater = void 0;
const UT = ot, Bl = Ot, kT = pe;
class MT extends UT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, kT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        this.listenerCount(Bl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (o) => this.emit(Bl.DOWNLOAD_PROGRESS, o)), await this.httpExecutor.download(n.url, i, s);
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
    const s = ["pacman", "-U", "--noconfirm", i];
    return this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${s.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
Gr.PacmanUpdater = MT;
var Vr = {};
Object.defineProperty(Vr, "__esModule", { value: !0 });
Vr.RpmUpdater = void 0;
const jT = ot, Hl = Ot, BT = pe;
class HT extends jT.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, BT.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        this.listenerCount(Hl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (o) => this.emit(Hl.DOWNLOAD_PROGRESS, o)), await this.httpExecutor.download(n.url, i, s);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.spawnSyncLog("which zypper"), s = this.installerPath;
    if (s == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    let o;
    return i ? o = [i, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", s] : o = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", s], this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${o.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
Vr.RpmUpdater = HT;
var Wr = {};
Object.defineProperty(Wr, "__esModule", { value: !0 });
Wr.MacUpdater = void 0;
const ql = ye, os = bt, qT = $e, Gl = Z, GT = $c, VT = _t, WT = pe, Vl = Kr, Wl = fr;
class YT extends VT.AppUpdater {
  constructor(t, r) {
    super(t, r), this.nativeUpdater = yt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (n) => {
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
    let s = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), s = (0, Vl.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), n.info(`Checked for macOS Rosetta environment (isRosetta=${s})`);
    } catch (u) {
      n.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${u}`);
    }
    let o = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const h = (0, Vl.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      n.info(`Checked 'uname -a': arm64=${h}`), o = o || h;
    } catch (u) {
      n.warn(`uname shell command to check for arm64 failed: ${u}`);
    }
    o = o || process.arch === "arm64" || s;
    const a = (u) => {
      var h;
      return u.url.pathname.includes("arm64") || ((h = u.info.url) === null || h === void 0 ? void 0 : h.includes("arm64"));
    };
    o && r.some(a) ? r = r.filter((u) => o === a(u)) : r = r.filter((u) => !a(u));
    const l = (0, WT.findFile)(r, "zip", ["pkg", "dmg"]);
    if (l == null)
      throw (0, ql.newError)(`ZIP file not provided: ${(0, ql.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const f = t.updateInfoAndProvider.provider, c = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: l,
      downloadUpdateOptions: t,
      task: async (u, h) => {
        const m = Gl.join(this.downloadedUpdateHelper.cacheDir, c), _ = () => (0, os.pathExistsSync)(m) ? !t.disableDifferentialDownload : (n.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let y = !0;
        _() && (y = await this.differentialDownloadInstaller(l, t, u, f, c)), y && await this.httpExecutor.download(l.url, u, h);
      },
      done: async (u) => {
        if (!t.disableDifferentialDownload)
          try {
            const h = Gl.join(this.downloadedUpdateHelper.cacheDir, c);
            await (0, os.copyFile)(u.downloadedFile, h);
          } catch (h) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${h.message}`);
          }
        return this.updateDownloaded(l, u);
      }
    });
  }
  async updateDownloaded(t, r) {
    var n;
    const i = r.downloadedFile, s = (n = t.info.size) !== null && n !== void 0 ? n : (await (0, os.stat)(i)).size, o = this._logger, a = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${a})`), this.server = (0, GT.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${a})`), this.server.on("close", () => {
      o.info(`Proxy server for native Squirrel.Mac is closed (${a})`);
    });
    const l = (f) => {
      const c = f.address();
      return typeof c == "string" ? c : `http://127.0.0.1:${c == null ? void 0 : c.port}`;
    };
    return await new Promise((f, c) => {
      const u = (0, Wl.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), h = Buffer.from(`autoupdater:${u}`, "ascii"), m = `/${(0, Wl.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (_, y) => {
        const w = _.url;
        if (o.info(`${w} requested`), w === "/") {
          if (!_.headers.authorization || _.headers.authorization.indexOf("Basic ") === -1) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), o.warn("No authenthication info");
            return;
          }
          const D = _.headers.authorization.split(" ")[1], L = Buffer.from(D, "base64").toString("ascii"), [B, H] = L.split(":");
          if (B !== "autoupdater" || H !== u) {
            y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), o.warn("Invalid authenthication credentials");
            return;
          }
          const j = Buffer.from(`{ "url": "${l(this.server)}${m}" }`);
          y.writeHead(200, { "Content-Type": "application/json", "Content-Length": j.length }), y.end(j);
          return;
        }
        if (!w.startsWith(m)) {
          o.warn(`${w} requested, but not supported`), y.writeHead(404), y.end();
          return;
        }
        o.info(`${m} requested by Squirrel.Mac, pipe ${i}`);
        let S = !1;
        y.on("finish", () => {
          S || (this.nativeUpdater.removeListener("error", c), f([]));
        });
        const A = (0, qT.createReadStream)(i);
        A.on("error", (D) => {
          try {
            y.end();
          } catch (L) {
            o.warn(`cannot end response: ${L}`);
          }
          S = !0, this.nativeUpdater.removeListener("error", c), c(new Error(`Cannot pipe "${i}": ${D}`));
        }), y.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": s
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
Wr.MacUpdater = YT;
var Yr = {}, Lo = {};
Object.defineProperty(Lo, "__esModule", { value: !0 });
Lo.verifySignature = XT;
const Yl = ye, Bf = Kr, zT = st, zl = Z;
function XT(e, t, r) {
  return new Promise((n, i) => {
    const s = t.replace(/'/g, "''");
    r.info(`Verifying signature ${s}`), (0, Bf.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${s}' | ConvertTo-Json -Compress"`], {
      shell: !0,
      timeout: 20 * 1e3
    }, (o, a, l) => {
      var f;
      try {
        if (o != null || l) {
          as(r, o, l, i), n(null);
          return;
        }
        const c = KT(a);
        if (c.Status === 0) {
          try {
            const _ = zl.normalize(c.Path), y = zl.normalize(t);
            if (r.info(`LiteralPath: ${_}. Update Path: ${y}`), _ !== y) {
              as(r, new Error(`LiteralPath of ${_} is different than ${y}`), l, i), n(null);
              return;
            }
          } catch (_) {
            r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(f = _.message) !== null && f !== void 0 ? f : _.stack}`);
          }
          const h = (0, Yl.parseDn)(c.SignerCertificate.Subject);
          let m = !1;
          for (const _ of e) {
            const y = (0, Yl.parseDn)(_);
            if (y.size ? m = Array.from(y.keys()).every((S) => y.get(S) === h.get(S)) : _ === h.get("CN") && (r.warn(`Signature validated using only CN ${_}. Please add your full Distinguished Name (DN) to publisherNames configuration`), m = !0), m) {
              n(null);
              return;
            }
          }
        }
        const u = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(c, (h, m) => h === "RawData" ? void 0 : m, 2);
        r.warn(`Sign verification failed, installer signed with incorrect certificate: ${u}`), n(u);
      } catch (c) {
        as(r, c, null, i), n(null);
        return;
      }
    });
  });
}
function KT(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const r = t.SignerCertificate;
  return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), t;
}
function as(e, t, r, n) {
  if (JT()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, Bf.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && n(t), r && n(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
}
function JT() {
  const e = zT.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(Yr, "__esModule", { value: !0 });
Yr.NsisUpdater = void 0;
const Pn = ye, Xl = Z, QT = ot, ZT = an, Kl = Ot, eS = pe, tS = bt, rS = Lo, Jl = dr;
class nS extends QT.BaseUpdater {
  constructor(t, r) {
    super(t, r), this._verifyUpdateCodeSignature = (n, i) => (0, rS.verifySignature)(n, i, this._logger);
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
    const r = t.updateInfoAndProvider.provider, n = (0, eS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: n,
      task: async (i, s, o, a) => {
        const l = n.packageInfo, f = l != null && o != null;
        if (f && t.disableWebInstaller)
          throw (0, Pn.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !f && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (f || t.disableDifferentialDownload || await this.differentialDownloadInstaller(n, t, i, r, Pn.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(n.url, i, s);
        const c = await this.verifySignature(i);
        if (c != null)
          throw await a(), (0, Pn.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${c}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (f && await this.differentialDownloadWebPackage(t, l, o, r))
          try {
            await this.httpExecutor.download(new Jl.URL(l.path), o, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: l.sha512
            });
          } catch (u) {
            try {
              await (0, tS.unlink)(o);
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
    const s = () => {
      this.spawnLog(Xl.join(process.resourcesPath, "elevate.exe"), [r].concat(n)).catch((o) => this.dispatchError(o));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), s(), !0) : (this.spawnLog(r, n).catch((o) => {
      const a = o.code;
      this._logger.info(`Cannot run installer: error code: ${a}, error message: "${o.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), a === "UNKNOWN" || a === "EACCES" ? s() : a === "ENOENT" ? yt.shell.openPath(r).catch((l) => this.dispatchError(l)) : this.dispatchError(o);
    }), !0);
  }
  async differentialDownloadWebPackage(t, r, n, i) {
    if (r.blockMapSize == null)
      return !0;
    try {
      const s = {
        newUrl: new Jl.URL(r.path),
        oldFile: Xl.join(this.downloadedUpdateHelper.cacheDir, Pn.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: n,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(Kl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (o) => this.emit(Kl.DOWNLOAD_PROGRESS, o)), await new ZT.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, s).download();
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "win32";
    }
    return !1;
  }
}
Yr.NsisUpdater = nS;
(function(e) {
  var t = Re && Re.__createBinding || (Object.create ? function(w, S, A, D) {
    D === void 0 && (D = A);
    var L = Object.getOwnPropertyDescriptor(S, A);
    (!L || ("get" in L ? !S.__esModule : L.writable || L.configurable)) && (L = { enumerable: !0, get: function() {
      return S[A];
    } }), Object.defineProperty(w, D, L);
  } : function(w, S, A, D) {
    D === void 0 && (D = A), w[D] = S[A];
  }), r = Re && Re.__exportStar || function(w, S) {
    for (var A in w) A !== "default" && !Object.prototype.hasOwnProperty.call(S, A) && t(S, w, A);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const n = bt, i = Z;
  var s = ot;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return s.BaseUpdater;
  } });
  var o = _t;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return o.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return o.NoOpLogger;
  } });
  var a = pe;
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
  let _;
  function y() {
    if (process.platform === "win32")
      _ = new Yr.NsisUpdater();
    else if (process.platform === "darwin")
      _ = new Wr.MacUpdater();
    else {
      _ = new Hr.AppImageUpdater();
      try {
        const w = i.join(process.resourcesPath, "package-type");
        if (!(0, n.existsSync)(w))
          return _;
        console.info("Checking for beta autoupdate feature for deb/rpm distributions");
        const S = (0, n.readFileSync)(w).toString().trim();
        switch (console.info("Found package-type:", S), S) {
          case "deb":
            _ = new qr.DebUpdater();
            break;
          case "rpm":
            _ = new Vr.RpmUpdater();
            break;
          case "pacman":
            _ = new Gr.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (w) {
        console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", w.message);
      }
    }
    return _;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => _ || y()
  });
})(Mt);
var kn = { exports: {} }, ls = { exports: {} }, Ql;
function Hf() {
  return Ql || (Ql = 1, function(e) {
    let t = {};
    try {
      t = require("electron");
    } catch {
    }
    t.ipcRenderer && r(t), e.exports = r;
    function r({ contextBridge: n, ipcRenderer: i }) {
      if (!i)
        return;
      i.on("__ELECTRON_LOG_IPC__", (o, a) => {
        window.postMessage({ cmd: "message", ...a });
      }), i.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((o) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${o.message}`
      )));
      const s = {
        sendToMain(o) {
          try {
            i.send("__ELECTRON_LOG__", o);
          } catch (a) {
            console.error("electronLog.sendToMain ", a, "data:", o), i.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: a == null ? void 0 : a.message, stack: a == null ? void 0 : a.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...o) {
          s.sendToMain({ data: o, level: "info" });
        }
      };
      for (const o of ["error", "warn", "info", "verbose", "debug", "silly"])
        s[o] = (...a) => s.sendToMain({
          data: a,
          level: o
        });
      if (n && process.contextIsolated)
        try {
          n.exposeInMainWorld("__electronLog", s);
        } catch {
        }
      typeof window == "object" ? window.__electronLog = s : __electronLog = s;
    }
  }(ls)), ls.exports;
}
var cs = { exports: {} }, us, Zl;
function iS() {
  if (Zl) return us;
  Zl = 1, us = e;
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
      for (const s of t.levels)
        i[s] = (...o) => t.logData(o, { level: s, scope: n });
      return i.log = i.info, i;
    }
  }
  return us;
}
var fs, ec;
function sS() {
  if (ec) return fs;
  ec = 1;
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
  return fs = e, fs;
}
var ds, tc;
function qf() {
  if (tc) return ds;
  tc = 1;
  const e = iS(), t = sS(), n = class n {
    constructor({
      allowUnknownLevel: s = !1,
      dependencies: o = {},
      errorHandler: a,
      eventLogger: l,
      initializeFn: f,
      isDev: c = !1,
      levels: u = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId: h,
      transportFactories: m = {},
      variables: _
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
      this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = s, this.buffering = new t(this), this.dependencies = o, this.initializeFn = f, this.isDev = c, this.levels = u, this.logId = h, this.scope = e(this), this.transportFactories = m, this.variables = _ || {};
      for (const y of this.levels)
        this.addLevel(y, !1);
      this.log = this.info, this.functions.log = this.log, this.errorHandler = a, a == null || a.setOptions({ ...o, logFn: this.error }), this.eventLogger = l, l == null || l.setOptions({ ...o, logger: this });
      for (const [y, w] of Object.entries(m))
        this.transports[y] = w(this, o);
      n.instances[h] = this;
    }
    static getInstance({ logId: s }) {
      return this.instances[s] || this.instances.default;
    }
    addLevel(s, o = this.levels.length) {
      o !== !1 && this.levels.splice(o, 0, s), this[s] = (...a) => this.logData(a, { level: s }), this.functions[s] = this[s];
    }
    catchErrors(s) {
      return this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      ), this.errorHandler.startCatching(s);
    }
    create(s) {
      return typeof s == "string" && (s = { logId: s }), new n({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...s
      });
    }
    compareLevels(s, o, a = this.levels) {
      const l = a.indexOf(s), f = a.indexOf(o);
      return f === -1 || l === -1 ? !0 : f <= l;
    }
    initialize(s = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...s });
    }
    logData(s, o = {}) {
      this.buffering.enabled ? this.buffering.addMessage({ data: s, date: /* @__PURE__ */ new Date(), ...o }) : this.processMessage({ data: s, ...o });
    }
    processMessage(s, { transports: o = this.transports } = {}) {
      if (s.cmd === "errorHandler") {
        this.errorHandler.handle(s.error, {
          errorName: s.errorName,
          processType: "renderer",
          showDialog: !!s.showDialog
        });
        return;
      }
      let a = s.level;
      this.allowUnknownLevel || (a = this.levels.includes(s.level) ? s.level : "info");
      const l = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...s,
        level: a,
        variables: {
          ...this.variables,
          ...s.variables
        }
      };
      for (const [f, c] of this.transportEntries(o))
        if (!(typeof c != "function" || c.level === !1) && this.compareLevels(c.level, s.level))
          try {
            const u = this.hooks.reduce((h, m) => h && m(h, c, f), l);
            u && c({ ...u, data: [...u.data] });
          } catch (u) {
            this.processInternalErrorFn(u);
          }
    }
    processInternalErrorFn(s) {
    }
    transportEntries(s = this.transports) {
      return (Array.isArray(s) ? s : Object.entries(s)).map((a) => {
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
  return ds = r, ds;
}
var hs, rc;
function oS() {
  if (rc) return hs;
  rc = 1;
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
      errorName: s = "",
      onError: o = this.onError,
      showDialog: a = this.showDialog
    } = {}) {
      try {
        (o == null ? void 0 : o({ error: n, errorName: s, processType: "renderer" })) !== !1 && i({ error: n, errorName: s, showDialog: a });
      } catch {
        e(n);
      }
    }
    setOptions({ logFn: n, onError: i, preventDefault: s, showDialog: o }) {
      typeof n == "function" && (this.logFn = n), typeof i == "function" && (this.onError = i), typeof s == "boolean" && (this.preventDefault = s), typeof o == "boolean" && (this.showDialog = o);
    }
    startCatching({ onError: n, showDialog: i } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: i }), window.addEventListener("error", (s) => {
        var o;
        this.preventDefault && ((o = s.preventDefault) == null || o.call(s)), this.handleError(s.error || s);
      }), window.addEventListener("unhandledrejection", (s) => {
        var o;
        this.preventDefault && ((o = s.preventDefault) == null || o.call(s)), this.handleRejection(s.reason || s);
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
  return hs = t, hs;
}
var ps, nc;
function Gt() {
  if (nc) return ps;
  nc = 1, ps = { transform: e };
  function e({
    logger: t,
    message: r,
    transport: n,
    initialData: i = (r == null ? void 0 : r.data) || [],
    transforms: s = n == null ? void 0 : n.transforms
  }) {
    return s.reduce((o, a) => typeof a == "function" ? a({ data: o, logger: t, message: r, transport: n }) : o, i);
  }
  return ps;
}
var ms, ic;
function aS() {
  if (ic) return ms;
  ic = 1;
  const { transform: e } = Gt();
  ms = r;
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
    return Object.assign(s, {
      format: "{h}:{i}:{s}.{ms}{scope} › {text}",
      transforms: [n],
      writeFn({ message: { level: o, data: a } }) {
        const l = t[o] || t.info;
        setTimeout(() => l(...a));
      }
    });
    function s(o) {
      s.writeFn({
        message: { ...o, data: e({ logger: i, message: o, transport: s }) }
      });
    }
  }
  function n({
    data: i = [],
    logger: s = {},
    message: o = {},
    transport: a = {}
  }) {
    if (typeof a.format == "function")
      return a.format({
        data: i,
        level: (o == null ? void 0 : o.level) || "info",
        logger: s,
        message: o,
        transport: a
      });
    if (typeof a.format != "string")
      return i;
    i.unshift(a.format), typeof i[1] == "string" && i[1].match(/%[1cdfiOos]/) && (i = [`${i[0]}${i[1]}`, ...i.slice(2)]);
    const l = o.date || /* @__PURE__ */ new Date();
    return i[0] = i[0].replace(/\{(\w+)}/g, (f, c) => {
      var u, h;
      switch (c) {
        case "level":
          return o.level;
        case "logId":
          return o.logId;
        case "scope": {
          const m = o.scope || ((u = s.scope) == null ? void 0 : u.defaultLabel);
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
          return ((h = o.variables) == null ? void 0 : h[c]) || f;
      }
    }).trim(), i;
  }
  return ms;
}
var gs, sc;
function lS() {
  if (sc) return gs;
  sc = 1;
  const { transform: e } = Gt();
  gs = r;
  const t = /* @__PURE__ */ new Set([Promise, WeakMap, WeakSet]);
  function r(s) {
    return Object.assign(o, {
      depth: 5,
      transforms: [i]
    });
    function o(a) {
      if (!window.__electronLog) {
        s.processMessage(
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
          logger: s,
          message: a,
          transport: o
        });
        __electronLog.sendToMain(l);
      } catch (l) {
        s.transports.console({
          data: ["electronLog.transports.ipc", l, "data:", a.data],
          level: "error"
        });
      }
    }
  }
  function n(s) {
    return Object(s) !== s;
  }
  function i({
    data: s,
    depth: o,
    seen: a = /* @__PURE__ */ new WeakSet(),
    transport: l = {}
  } = {}) {
    const f = o || l.depth || 5;
    return a.has(s) ? "[Circular]" : f < 1 ? n(s) ? s : Array.isArray(s) ? "[Array]" : `[${typeof s}]` : ["function", "symbol"].includes(typeof s) ? s.toString() : n(s) ? s : t.has(s.constructor) ? `[${s.constructor.name}]` : Array.isArray(s) ? s.map((c) => i({
      data: c,
      depth: f - 1,
      seen: a
    })) : s instanceof Date ? s.toISOString() : s instanceof Error ? s.stack : s instanceof Map ? new Map(
      Array.from(s).map(([c, u]) => [
        i({ data: c, depth: f - 1, seen: a }),
        i({ data: u, depth: f - 1, seen: a })
      ])
    ) : s instanceof Set ? new Set(
      Array.from(s).map(
        (c) => i({ data: c, depth: f - 1, seen: a })
      )
    ) : (a.add(s), Object.fromEntries(
      Object.entries(s).map(
        ([c, u]) => [
          c,
          i({ data: u, depth: f - 1, seen: a })
        ]
      )
    ));
  }
  return gs;
}
var oc;
function cS() {
  return oc || (oc = 1, function(e) {
    const t = qf(), r = oS(), n = aS(), i = lS();
    typeof process == "object" && process.type === "browser" && console.warn(
      "electron-log/renderer is loaded in the main process. It could cause unexpected behaviour."
    ), e.exports = s(), e.exports.Logger = t, e.exports.default = e.exports;
    function s() {
      const o = new t({
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
      return o.errorHandler.setOptions({
        logFn({ error: a, errorName: l, showDialog: f }) {
          o.transports.console({
            data: [l, a].filter(Boolean),
            level: "error"
          }), o.transports.ipc({
            cmd: "errorHandler",
            error: {
              cause: a == null ? void 0 : a.cause,
              code: a == null ? void 0 : a.code,
              name: a == null ? void 0 : a.name,
              message: a == null ? void 0 : a.message,
              stack: a == null ? void 0 : a.stack
            },
            errorName: l,
            logId: o.logId,
            showDialog: f
          });
        }
      }), typeof window == "object" && window.addEventListener("message", (a) => {
        const { cmd: l, logId: f, ...c } = a.data || {}, u = t.getInstance({ logId: f });
        l === "message" && u.processMessage(c, { transports: ["console"] });
      }), new Proxy(o, {
        get(a, l) {
          return typeof a[l] < "u" ? a[l] : (...f) => o.logData(f, { level: l });
        }
      });
    }
  }(cs)), cs.exports;
}
var Es, ac;
function uS() {
  if (ac) return Es;
  ac = 1;
  const e = $e, t = Z;
  Es = {
    findAndReadPackageJson: r,
    tryReadJsonAt: n
  };
  function r() {
    return n(o()) || n(s()) || n(process.resourcesPath, "app.asar") || n(process.resourcesPath, "app") || n(process.cwd()) || { name: void 0, version: void 0 };
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
  function s() {
    const a = process.argv.filter((f) => f.indexOf("--user-data-dir=") === 0);
    return a.length === 0 || typeof a[0] != "string" ? null : a[0].replace("--user-data-dir=", "");
  }
  function o() {
    var a;
    try {
      return (a = require.main) == null ? void 0 : a.filename;
    } catch {
      return;
    }
  }
  return Es;
}
var ys, lc;
function Gf() {
  if (lc) return ys;
  lc = 1;
  const e = Kr, t = st, r = Z, n = uS();
  class i {
    constructor() {
      W(this, "appName");
      W(this, "appPackageJson");
      W(this, "platform", process.platform);
    }
    getAppLogPath(o = this.getAppName()) {
      return this.platform === "darwin" ? r.join(this.getSystemPathHome(), "Library/Logs", o) : r.join(this.getAppUserDataPath(o), "logs");
    }
    getAppName() {
      var a;
      const o = this.appName || ((a = this.getAppPackageJson()) == null ? void 0 : a.name);
      if (!o)
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      return o;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      return typeof this.appPackageJson != "object" && (this.appPackageJson = n.findAndReadPackageJson()), this.appPackageJson;
    }
    getAppUserDataPath(o = this.getAppName()) {
      return o ? r.join(this.getSystemPathAppData(), o) : void 0;
    }
    getAppVersion() {
      var o;
      return (o = this.getAppPackageJson()) == null ? void 0 : o.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const o = Number(t.release().split(".")[0]);
      return o <= 19 ? `10.${o - 4}` : o - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let o = t.type().replace("_", " "), a = t.release();
      return o === "Darwin" && (o = "macOS", a = this.getMacOsVersion()), `${o} ${a}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const o = this.getAppName(), a = this.getAppVersion(), l = this;
      return {
        appData: this.getSystemPathAppData(),
        appName: o,
        appVersion: a,
        get electronDefaultDir() {
          return l.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(o),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(o)
      };
    }
    getSystemPathAppData() {
      const o = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin":
          return r.join(o, "Library/Application Support");
        case "win32":
          return process.env.APPDATA || r.join(o, "AppData/Roaming");
        default:
          return process.env.XDG_CONFIG_HOME || r.join(o, ".config");
      }
    }
    getSystemPathHome() {
      var o;
      return ((o = t.homedir) == null ? void 0 : o.call(t)) || process.env.HOME;
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
    onAppEvent(o, a) {
    }
    onAppReady(o) {
      o();
    }
    onEveryWebContentsEvent(o, a) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(o, a) {
    }
    onIpcInvoke(o, a) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(o, a = console.error) {
      const f = { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] || "xdg-open";
      e.exec(`${f} ${o}`, {}, (c) => {
        c && a(c);
      });
    }
    setAppName(o) {
      this.appName = o;
    }
    setPlatform(o) {
      this.platform = o;
    }
    setPreloadFileForSessions({
      filePath: o,
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
    sendIpc(o, a) {
    }
    showErrorBox(o, a) {
    }
  }
  return ys = i, ys;
}
var vs, cc;
function fS() {
  if (cc) return vs;
  cc = 1;
  const e = Z, t = Gf();
  class r extends t {
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron: s } = {}) {
      super();
      /**
       * @type {typeof Electron}
       */
      W(this, "electron");
      this.electron = s;
    }
    getAppName() {
      var o, a;
      let s;
      try {
        s = this.appName || ((o = this.electron.app) == null ? void 0 : o.name) || ((a = this.electron.app) == null ? void 0 : a.getName());
      } catch {
      }
      return s || super.getAppName();
    }
    getAppUserDataPath(s) {
      return this.getPath("userData") || super.getAppUserDataPath(s);
    }
    getAppVersion() {
      var o;
      let s;
      try {
        s = (o = this.electron.app) == null ? void 0 : o.getVersion();
      } catch {
      }
      return s || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(s) {
      var o;
      try {
        return (o = this.electron.app) == null ? void 0 : o.getPath(s);
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
      var s;
      return ((s = this.electron.app) == null ? void 0 : s.isPackaged) !== void 0 ? !this.electron.app.isPackaged : typeof process.execPath == "string" ? e.basename(process.execPath).toLowerCase().startsWith("electron") : super.isDev();
    }
    onAppEvent(s, o) {
      var a;
      return (a = this.electron.app) == null || a.on(s, o), () => {
        var l;
        (l = this.electron.app) == null || l.off(s, o);
      };
    }
    onAppReady(s) {
      var o, a, l;
      (o = this.electron.app) != null && o.isReady() ? s() : (a = this.electron.app) != null && a.once ? (l = this.electron.app) == null || l.once("ready", s) : s();
    }
    onEveryWebContentsEvent(s, o) {
      var l, f, c;
      return (f = (l = this.electron.webContents) == null ? void 0 : l.getAllWebContents()) == null || f.forEach((u) => {
        u.on(s, o);
      }), (c = this.electron.app) == null || c.on("web-contents-created", a), () => {
        var u, h;
        (u = this.electron.webContents) == null || u.getAllWebContents().forEach((m) => {
          m.off(s, o);
        }), (h = this.electron.app) == null || h.off("web-contents-created", a);
      };
      function a(u, h) {
        h.on(s, o);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(s, o) {
      var a;
      (a = this.electron.ipcMain) == null || a.on(s, o);
    }
    onIpcInvoke(s, o) {
      var a, l;
      (l = (a = this.electron.ipcMain) == null ? void 0 : a.handle) == null || l.call(a, s, o);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(s, o = console.error) {
      var a;
      (a = this.electron.shell) == null || a.openExternal(s).catch(o);
    }
    setPreloadFileForSessions({
      filePath: s,
      includeFutureSession: o = !0,
      getSessions: a = () => {
        var l;
        return [(l = this.electron.session) == null ? void 0 : l.defaultSession];
      }
    }) {
      for (const f of a().filter(Boolean))
        l(f);
      o && this.onAppEvent("session-created", (f) => {
        l(f);
      });
      function l(f) {
        typeof f.registerPreloadScript == "function" ? f.registerPreloadScript({
          filePath: s,
          id: "electron-log-preload",
          type: "frame"
        }) : f.setPreloads([...f.getPreloads(), s]);
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(s, o) {
      var a, l;
      (l = (a = this.electron.BrowserWindow) == null ? void 0 : a.getAllWindows()) == null || l.forEach((f) => {
        var c, u;
        ((c = f.webContents) == null ? void 0 : c.isDestroyed()) === !1 && ((u = f.webContents) == null ? void 0 : u.isCrashed()) === !1 && f.webContents.send(s, o);
      });
    }
    showErrorBox(s, o) {
      var a;
      (a = this.electron.dialog) == null || a.showErrorBox(s, o);
    }
  }
  return vs = r, vs;
}
var _s, uc;
function dS() {
  if (uc) return _s;
  uc = 1;
  const e = $e, t = st, r = Z, n = Hf();
  _s = {
    initialize({
      externalApi: o,
      getSessions: a,
      includeFutureSession: l,
      logger: f,
      preload: c = !0,
      spyRendererConsole: u = !1
    }) {
      o.onAppReady(() => {
        try {
          c && i({
            externalApi: o,
            getSessions: a,
            includeFutureSession: l,
            preloadOption: c
          }), u && s({ externalApi: o, logger: f });
        } catch (h) {
          f.warn(h);
        }
      });
    }
  };
  function i({
    externalApi: o,
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
        o.getAppUserDataPath() || t.tmpdir(),
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
    o.setPreloadFileForSessions({
      filePath: c,
      includeFutureSession: l,
      getSessions: a
    });
  }
  function s({ externalApi: o, logger: a }) {
    const l = ["debug", "info", "warn", "error"];
    o.onEveryWebContentsEvent(
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
  return _s;
}
var ws, fc;
function hS() {
  if (fc) return ws;
  fc = 1;
  class e {
    constructor({
      externalApi: n,
      logFn: i = void 0,
      onError: s = void 0,
      showDialog: o = void 0
    } = {}) {
      W(this, "externalApi");
      W(this, "isActive", !1);
      W(this, "logFn");
      W(this, "onError");
      W(this, "showDialog", !0);
      this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({ externalApi: n, logFn: i, onError: s, showDialog: o }), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
    }
    handle(n, {
      logFn: i = this.logFn,
      onError: s = this.onError,
      processType: o = "browser",
      showDialog: a = this.showDialog,
      errorName: l = ""
    } = {}) {
      var f;
      n = t(n);
      try {
        if (typeof s == "function") {
          const c = ((f = this.externalApi) == null ? void 0 : f.getVersions()) || {}, u = this.createIssue;
          if (s({
            createIssue: u,
            error: n,
            errorName: l,
            processType: o,
            versions: c
          }) === !1)
            return;
        }
        l ? i(l, n) : i(n), a && !l.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${o} process`,
          n.stack
        );
      } catch {
        console.error(n);
      }
    }
    setOptions({ externalApi: n, logFn: i, onError: s, showDialog: o }) {
      typeof n == "object" && (this.externalApi = n), typeof i == "function" && (this.logFn = i), typeof s == "function" && (this.onError = s), typeof o == "boolean" && (this.showDialog = o);
    }
    startCatching({ onError: n, showDialog: i } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: i }), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
    }
    stopCatching() {
      this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(n, i) {
      var s;
      (s = this.externalApi) == null || s.openUrl(
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
  return ws = e, ws;
}
var Ts, dc;
function pS() {
  if (dc) return Ts;
  dc = 1;
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
          "console-message": ({ args: [r, n, i, s] }) => {
            if (!(r < 3))
              return { message: n, source: `${s}:${i}` };
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
      logger: s,
      format: o,
      formatters: a,
      scope: l
    }) {
      typeof r == "object" && (this.events = r), typeof n == "object" && (this.externalApi = n), typeof i == "string" && (this.level = i), typeof s == "object" && (this.logger = s), (typeof o == "string" || typeof o == "function") && (this.format = o), typeof a == "object" && (this.formatters = a), typeof l == "string" && (this.scope = l);
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
      return n.forEach((s, o) => {
        i[s] = r[o];
      }), r.length > n.length && (i.unknownArgs = r.slice(n.length)), i;
    }
    disposeListeners() {
      this.disposers.forEach((r) => r()), this.disposers = [];
    }
    formatEventLog({ eventName: r, eventSource: n, handlerArgs: i }) {
      var u;
      const [s, ...o] = i;
      if (typeof this.format == "function")
        return this.format({ args: o, event: s, eventName: r, eventSource: n });
      const a = (u = this.formatters[n]) == null ? void 0 : u[r];
      let l = o;
      if (typeof a == "function" && (l = a({ args: o, event: s, eventName: r, eventSource: n })), !l)
        return;
      const f = {};
      return Array.isArray(l) ? f.args = l : typeof l == "object" && Object.assign(f, l), n === "webContents" && Object.assign(f, this.getWebContentsDetails(s == null ? void 0 : s.sender)), [this.format.replace("{eventSource}", n === "app" ? "App" : "WebContents").replace("{eventName}", r), f];
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
      var o;
      const s = this.formatEventLog({ eventName: r, eventSource: n, handlerArgs: i });
      if (s) {
        const a = this.scope ? this.logger.scope(this.scope) : this.logger;
        (o = a == null ? void 0 : a[this.level]) == null || o.call(a, ...s);
      }
    }
  }
  return Ts = e, Ts;
}
var Ss, hc;
function Vf() {
  if (hc) return Ss;
  hc = 1;
  const { transform: e } = Gt();
  Ss = {
    concatFirstStringElements: t,
    formatScope: n,
    formatText: s,
    formatVariables: i,
    timeZoneFromOffset: r,
    format({ message: o, logger: a, transport: l, data: f = o == null ? void 0 : o.data }) {
      switch (typeof l.format) {
        case "string":
          return e({
            message: o,
            logger: a,
            transforms: [i, n, s],
            transport: l,
            initialData: [l.format, ...f]
          });
        case "function":
          return l.format({
            data: f,
            level: (o == null ? void 0 : o.level) || "info",
            logger: a,
            message: o,
            transport: l
          });
        default:
          return f;
      }
    }
  };
  function t({ data: o }) {
    return typeof o[0] != "string" || typeof o[1] != "string" || o[0].match(/%[1cdfiOos]/) ? o : [`${o[0]} ${o[1]}`, ...o.slice(2)];
  }
  function r(o) {
    const a = Math.abs(o), l = o > 0 ? "-" : "+", f = Math.floor(a / 60).toString().padStart(2, "0"), c = (a % 60).toString().padStart(2, "0");
    return `${l}${f}:${c}`;
  }
  function n({ data: o, logger: a, message: l }) {
    const { defaultLabel: f, labelLength: c } = (a == null ? void 0 : a.scope) || {}, u = o[0];
    let h = l.scope;
    h || (h = f);
    let m;
    return h === "" ? m = c > 0 ? "".padEnd(c + 3) : "" : typeof h == "string" ? m = ` (${h})`.padEnd(c + 3) : m = "", o[0] = u.replace("{scope}", m), o;
  }
  function i({ data: o, message: a }) {
    let l = o[0];
    if (typeof l != "string")
      return o;
    l = l.replace("{level}]", `${a.level}]`.padEnd(6, " "));
    const f = a.date || /* @__PURE__ */ new Date();
    return o[0] = l.replace(/\{(\w+)}/g, (c, u) => {
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
    }).trim(), o;
  }
  function s({ data: o }) {
    const a = o[0];
    if (typeof a != "string")
      return o;
    if (a.lastIndexOf("{text}") === a.length - 6)
      return o[0] = a.replace(/\s?{text}/, ""), o[0] === "" && o.shift(), o;
    const f = a.split("{text}");
    let c = [];
    return f[0] !== "" && c.push(f[0]), c = c.concat(o.slice(1)), f[1] !== "" && c.push(f[1]), c;
  }
  return Ss;
}
var As = { exports: {} }, pc;
function Si() {
  return pc || (pc = 1, function(e) {
    const t = Zn;
    e.exports = {
      serialize: n,
      maxDepth({ data: i, transport: s, depth: o = (s == null ? void 0 : s.depth) ?? 6 }) {
        if (!i)
          return i;
        if (o < 1)
          return Array.isArray(i) ? "[array]" : typeof i == "object" && i ? "[object]" : i;
        if (Array.isArray(i))
          return i.map((l) => e.exports.maxDepth({
            data: l,
            depth: o - 1
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
            depth: o - 1
          }));
        return a;
      },
      toJSON({ data: i }) {
        return JSON.parse(JSON.stringify(i, r()));
      },
      toString({ data: i, transport: s }) {
        const o = (s == null ? void 0 : s.inspectOptions) || {}, a = i.map((l) => {
          if (l !== void 0)
            try {
              const f = JSON.stringify(l, r(), "  ");
              return f === void 0 ? void 0 : JSON.parse(f);
            } catch {
              return l;
            }
        });
        return t.formatWithOptions(o, ...a);
      }
    };
    function r(i = {}) {
      const s = /* @__PURE__ */ new WeakSet();
      return function(o, a) {
        if (typeof a == "object" && a !== null) {
          if (s.has(a))
            return;
          s.add(a);
        }
        return n(o, a, i);
      };
    }
    function n(i, s, o = {}) {
      const a = (o == null ? void 0 : o.serializeMapAndSet) !== !1;
      return s instanceof Error ? s.stack : s && (typeof s == "function" ? `[function] ${s.toString()}` : s instanceof Date ? s.toISOString() : a && s instanceof Map && Object.fromEntries ? Object.fromEntries(s) : a && s instanceof Set && Array.from ? Array.from(s) : s);
    }
  }(As)), As.exports;
}
var bs, mc;
function xo() {
  if (mc) return bs;
  mc = 1, bs = {
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
    const s = i.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return e[s] || "";
  }
  function r(i) {
    return i + e.unset;
  }
  function n(i, s, o) {
    const a = {};
    return i.reduce((l, f, c, u) => {
      if (a[c])
        return l;
      if (typeof f == "string") {
        let h = c, m = !1;
        f = f.replace(/%[1cdfiOos]/g, (_) => {
          if (h += 1, _ !== "%c")
            return _;
          const y = u[h];
          return typeof y == "string" ? (a[h] = !0, m = !0, s(y, f)) : _;
        }), m && o && (f = o(f));
      }
      return l.push(f), l;
    }, []);
  }
  return bs;
}
var Os, gc;
function mS() {
  if (gc) return Os;
  gc = 1;
  const {
    concatFirstStringElements: e,
    format: t
  } = Vf(), { maxDepth: r, toJSON: n } = Si(), {
    applyAnsiStyles: i,
    removeStyles: s
  } = xo(), { transform: o } = Gt(), a = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  Os = c;
  const f = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
  Object.assign(c, {
    DEFAULT_FORMAT: f
  });
  function c(y) {
    return Object.assign(w, {
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
    function w(S) {
      const A = o({ logger: y, message: S, transport: w });
      w.writeFn({
        message: { ...S, data: A }
      });
    }
  }
  function u({ data: y, message: w, transport: S }) {
    return typeof S.format != "string" || !S.format.includes("%c") ? y : [`color:${_(w.level)}`, "color:unset", ...y];
  }
  function h(y, w) {
    if (typeof y == "boolean")
      return y;
    const A = w === "error" || w === "warn" ? process.stderr : process.stdout;
    return A && A.isTTY;
  }
  function m(y) {
    const { message: w, transport: S } = y;
    return (h(S.useStyles, w.level) ? i : s)(y);
  }
  function _(y) {
    const w = { error: "red", warn: "yellow", info: "cyan", default: "unset" };
    return w[y] || w.default;
  }
  return Os;
}
var Cs, Ec;
function Wf() {
  if (Ec) return Cs;
  Ec = 1;
  const e = ei, t = $e, r = st;
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
  Cs = n;
  function i(s, o) {
    const a = Buffer.alloc(o), l = t.statSync(s), f = Math.min(l.size, o), c = Math.max(0, l.size - o), u = t.openSync(s, "r"), h = t.readSync(u, a, 0, f, c);
    return t.closeSync(u), a.toString("utf8", 0, h);
  }
  return Cs;
}
var Rs, yc;
function gS() {
  if (yc) return Rs;
  yc = 1;
  const e = Wf();
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
  return Rs = t, Rs;
}
var Is, vc;
function ES() {
  if (vc) return Is;
  vc = 1;
  const e = ei, t = $e, r = Z, n = Wf(), i = gS();
  class s extends e {
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
  return Is = s, Is;
}
var Ns, _c;
function yS() {
  if (_c) return Ns;
  _c = 1;
  const e = $e, t = st, r = Z, n = ES(), { transform: i } = Gt(), { removeStyles: s } = xo(), {
    format: o,
    concatFirstStringElements: a
  } = Vf(), { toString: l } = Si();
  Ns = c;
  const f = new n();
  function c(h, { registry: m = f, externalApi: _ } = {}) {
    let y;
    return m.listenerCount("error") < 1 && m.on("error", (B, H) => {
      A(`Can't write to ${H}`, B);
    }), Object.assign(w, {
      fileName: u(h.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: D,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: L,
      sync: !0,
      transforms: [s, o, a, l],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(B) {
        const H = B.toString(), j = r.parse(H);
        try {
          e.renameSync(H, r.join(j.dir, `${j.name}.old${j.ext}`));
        } catch (ue) {
          A("Could not rotate log", ue);
          const E = Math.round(w.maxSize / 4);
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
    function w(B) {
      const H = D(B);
      w.maxSize > 0 && H.size > w.maxSize && (w.archiveLogFn(H), H.reset());
      const ue = i({ logger: h, message: B, transport: w });
      H.writeLine(ue);
    }
    function S() {
      y || (y = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            _.getPathVariables()
          ),
          fileName: {
            get() {
              return w.fileName;
            },
            enumerable: !0
          }
        }
      ), typeof w.archiveLog == "function" && (w.archiveLogFn = w.archiveLog, A("archiveLog is deprecated. Use archiveLogFn instead")), typeof w.resolvePath == "function" && (w.resolvePathFn = w.resolvePath, A("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function A(B, H = null, j = "error") {
      const ue = [`electron-log.transports.file: ${B}`];
      H && ue.push(H), h.transports.console({ data: ue, date: /* @__PURE__ */ new Date(), level: j });
    }
    function D(B) {
      S();
      const H = w.resolvePathFn(y, B);
      return m.provide({
        filePath: H,
        writeAsync: !w.sync,
        writeOptions: w.writeOptions
      });
    }
    function L({ fileFilter: B = (H) => H.endsWith(".log") } = {}) {
      S();
      const H = r.dirname(w.resolvePathFn(y));
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
  return Ns;
}
var $s, wc;
function vS() {
  if (wc) return $s;
  wc = 1;
  const { maxDepth: e, toJSON: t } = Si(), { transform: r } = Gt();
  $s = n;
  function n(i, { externalApi: s }) {
    return Object.assign(o, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: i.isDev ? "silly" : !1,
      transforms: [t, e]
    }), s != null && s.isElectron() ? o : void 0;
    function o(a) {
      var l;
      ((l = a == null ? void 0 : a.variables) == null ? void 0 : l.processType) !== "renderer" && (s == null || s.sendIpc(o.eventId, {
        ...a,
        data: r({ logger: i, message: a, transport: o })
      }));
    }
  }
  return $s;
}
var Ds, Tc;
function _S() {
  if (Tc) return Ds;
  Tc = 1;
  const e = $c, t = ch, { transform: r } = Gt(), { removeStyles: n } = xo(), { toJSON: i, maxDepth: s } = Si();
  Ds = o;
  function o(a) {
    return Object.assign(l, {
      client: { name: "electron-application" },
      depth: 6,
      level: !1,
      requestOptions: {},
      transforms: [n, i, s],
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
  return Ds;
}
var Ps, Sc;
function Yf() {
  if (Sc) return Ps;
  Sc = 1;
  const e = qf(), t = hS(), r = pS(), n = mS(), i = yS(), s = vS(), o = _S();
  Ps = a;
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
        ipc: s,
        remote: o
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
  return Ps;
}
var Fs, Ac;
function wS() {
  if (Ac) return Fs;
  Ac = 1;
  const e = yt, t = fS(), { initialize: r } = dS(), n = Yf(), i = new t({ electron: e }), s = n({
    dependencies: { externalApi: i },
    initializeFn: r
  });
  Fs = s, i.onIpc("__ELECTRON_LOG__", (a, l) => {
    l.scope && s.Logger.getInstance(l).scope(l.scope);
    const f = new Date(l.date);
    o({
      ...l,
      date: f.getTime() ? f : /* @__PURE__ */ new Date()
    });
  }), i.onIpcInvoke("__ELECTRON_LOG__", (a, { cmd: l = "", logId: f }) => {
    switch (l) {
      case "getOptions":
        return {
          levels: s.Logger.getInstance({ logId: f }).levels,
          logId: f
        };
      default:
        return o({ data: [`Unknown cmd '${l}'`], level: "error" }), {};
    }
  });
  function o(a) {
    var l;
    (l = s.Logger.getInstance(a)) == null || l.processMessage(a);
  }
  return Fs;
}
var Ls, bc;
function TS() {
  if (bc) return Ls;
  bc = 1;
  const e = Gf(), t = Yf(), r = new e();
  return Ls = t({
    dependencies: { externalApi: r }
  }), Ls;
}
const SS = typeof process > "u" || process.type === "renderer" || process.type === "worker", AS = typeof process == "object" && process.type === "browser";
SS ? (Hf(), kn.exports = cS()) : AS ? kn.exports = wS() : kn.exports = TS();
var bS = kn.exports;
const zf = /* @__PURE__ */ Pc(bS), OS = () => X.prepare("SELECT * FROM courts ORDER BY name ASC").all(), CS = () => X.prepare("SELECT * FROM tags ORDER BY name ASC").all(), RS = (e) => {
  X.prepare(`
    UPDATE courts SET is_synced = 1 WHERE id = ?
  `).run(e);
}, IS = (e) => {
  X.prepare(`
    UPDATE tags SET is_synced = 1 WHERE id = ?
  `).run(e);
}, NS = () => X.prepare(`
      SELECT * FROM courts WHERE is_synced = 0
    `).all(), $S = () => X.prepare(`
      SELECT * FROM tags WHERE is_synced = 0
    `).all(), DS = (e, t, r) => {
  const n = X.prepare(`
    INSERT INTO courts (id, name, created_at, is_synced)
    VALUES (@id, @name, @created_at, @is_synced)
    ON CONFLICT(name) DO NOTHING
  `), i = {
    id: t || Dc(),
    name: e,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: r || 0
  };
  return n.run(i).changes > 0;
}, PS = (e, t, r) => {
  const n = X.prepare(`
    INSERT INTO tags (id, name, created_at, is_synced)
    VALUES (@id, @name, @created_at, @is_synced)
    ON CONFLICT(name) DO NOTHING
  `), i = {
    id: t || Dc(),
    name: e,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    is_synced: r || 0
  };
  return n.run(i).changes > 0;
};
async function FS(e) {
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
const LS = "16.5.0", xS = {
  version: LS
}, Zs = $e, Uo = Z, US = st, kS = fr, MS = xS, Xf = MS.version, jS = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function BS(e) {
  const t = {};
  let r = e.toString();
  r = r.replace(/\r\n?/mg, `
`);
  let n;
  for (; (n = jS.exec(r)) != null; ) {
    const i = n[1];
    let s = n[2] || "";
    s = s.trim();
    const o = s[0];
    s = s.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), o === '"' && (s = s.replace(/\\n/g, `
`), s = s.replace(/\\r/g, "\r")), t[i] = s;
  }
  return t;
}
function HS(e) {
  const t = Jf(e), r = he.configDotenv({ path: t });
  if (!r.parsed) {
    const o = new Error(`MISSING_DATA: Cannot parse ${t} for an unknown reason`);
    throw o.code = "MISSING_DATA", o;
  }
  const n = Kf(e).split(","), i = n.length;
  let s;
  for (let o = 0; o < i; o++)
    try {
      const a = n[o].trim(), l = GS(r, a);
      s = he.decrypt(l.ciphertext, l.key);
      break;
    } catch (a) {
      if (o + 1 >= i)
        throw a;
    }
  return he.parse(s);
}
function qS(e) {
  console.log(`[dotenv@${Xf}][WARN] ${e}`);
}
function zr(e) {
  console.log(`[dotenv@${Xf}][DEBUG] ${e}`);
}
function Kf(e) {
  return e && e.DOTENV_KEY && e.DOTENV_KEY.length > 0 ? e.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
}
function GS(e, t) {
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
  const s = `DOTENV_VAULT_${i.toUpperCase()}`, o = e.parsed[s];
  if (!o) {
    const a = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${s} in your .env.vault file.`);
    throw a.code = "NOT_FOUND_DOTENV_ENVIRONMENT", a;
  }
  return { ciphertext: o, key: n };
}
function Jf(e) {
  let t = null;
  if (e && e.path && e.path.length > 0)
    if (Array.isArray(e.path))
      for (const r of e.path)
        Zs.existsSync(r) && (t = r.endsWith(".vault") ? r : `${r}.vault`);
    else
      t = e.path.endsWith(".vault") ? e.path : `${e.path}.vault`;
  else
    t = Uo.resolve(process.cwd(), ".env.vault");
  return Zs.existsSync(t) ? t : null;
}
function Oc(e) {
  return e[0] === "~" ? Uo.join(US.homedir(), e.slice(1)) : e;
}
function VS(e) {
  !!(e && e.debug) && zr("Loading env from encrypted .env.vault");
  const r = he._parseVault(e);
  let n = process.env;
  return e && e.processEnv != null && (n = e.processEnv), he.populate(n, r, e), { parsed: r };
}
function WS(e) {
  const t = Uo.resolve(process.cwd(), ".env");
  let r = "utf8";
  const n = !!(e && e.debug);
  e && e.encoding ? r = e.encoding : n && zr("No encoding is specified. UTF-8 is used by default");
  let i = [t];
  if (e && e.path)
    if (!Array.isArray(e.path))
      i = [Oc(e.path)];
    else {
      i = [];
      for (const l of e.path)
        i.push(Oc(l));
    }
  let s;
  const o = {};
  for (const l of i)
    try {
      const f = he.parse(Zs.readFileSync(l, { encoding: r }));
      he.populate(o, f, e);
    } catch (f) {
      n && zr(`Failed to load ${l} ${f.message}`), s = f;
    }
  let a = process.env;
  return e && e.processEnv != null && (a = e.processEnv), he.populate(a, o, e), s ? { parsed: o, error: s } : { parsed: o };
}
function YS(e) {
  if (Kf(e).length === 0)
    return he.configDotenv(e);
  const t = Jf(e);
  return t ? he._configVault(e) : (qS(`You set DOTENV_KEY but you are missing a .env.vault file at ${t}. Did you forget to build it?`), he.configDotenv(e));
}
function zS(e, t) {
  const r = Buffer.from(t.slice(-64), "hex");
  let n = Buffer.from(e, "base64");
  const i = n.subarray(0, 12), s = n.subarray(-16);
  n = n.subarray(12, -16);
  try {
    const o = kS.createDecipheriv("aes-256-gcm", r, i);
    return o.setAuthTag(s), `${o.update(n)}${o.final()}`;
  } catch (o) {
    const a = o instanceof RangeError, l = o.message === "Invalid key length", f = o.message === "Unsupported state or unable to authenticate data";
    if (a || l) {
      const c = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      throw c.code = "INVALID_DOTENV_KEY", c;
    } else if (f) {
      const c = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      throw c.code = "DECRYPTION_FAILED", c;
    } else
      throw o;
  }
}
function XS(e, t, r = {}) {
  const n = !!(r && r.debug), i = !!(r && r.override);
  if (typeof t != "object") {
    const s = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw s.code = "OBJECT_REQUIRED", s;
  }
  for (const s of Object.keys(t))
    Object.prototype.hasOwnProperty.call(e, s) ? (i === !0 && (e[s] = t[s]), n && zr(i === !0 ? `"${s}" is already defined and WAS overwritten` : `"${s}" is already defined and was NOT overwritten`)) : e[s] = t[s];
}
const he = {
  configDotenv: WS,
  _configVault: VS,
  _parseVault: HS,
  config: YS,
  decrypt: zS,
  parse: BS,
  populate: XS
};
at.exports.configDotenv = he.configDotenv;
at.exports._configVault = he._configVault;
at.exports._parseVault = he._parseVault;
at.exports.config = he.config;
at.exports.decrypt = he.decrypt;
at.exports.parse = he.parse;
at.exports.populate = he.populate;
at.exports = he;
var KS = at.exports;
const JS = /* @__PURE__ */ Pc(KS), Qf = ro(import.meta.url), Cc = Qf("fs"), xs = Qf("path"), QS = (e, t) => {
  const r = uh.from(t), n = xs.join(vt.getAppPath(), "documents", "templates");
  Cc.mkdirSync(n, { recursive: !0 });
  const i = xs.join(n, e);
  return Cc.writeFileSync(i, r), xs.resolve(i);
};
JS.config();
ro(import.meta.url);
const ZS = oh(import.meta.url), Qn = je.dirname(ZS);
process.env.APP_ROOT = je.join(Qn, "..");
const Mn = process.env.VITE_DEV_SERVER_URL, AA = je.join(process.env.APP_ROOT, "dist-electron"), eo = je.join(process.env.APP_ROOT, "dist"), Zf = je.join(process.env.APP_ROOT, "splash");
console.log(Zf);
process.env.VITE_PUBLIC = Mn ? je.join(process.env.APP_ROOT, "public") : eo;
let ie, xe = null;
function eA() {
  xe = new to({
    width: 500,
    height: 300,
    frame: !1,
    resizable: !1,
    transparent: !1,
    alwaysOnTop: !0,
    center: !0,
    show: !1,
    webPreferences: {
      preload: je.join(Qn, "preload.mjs")
    }
  }), xe.webContents.on("did-finish-load", () => {
    xe == null || xe.show();
  }), xe.loadFile(je.join(Zf, "index.html")), xe.setMenuBarVisibility(!1);
}
function ed() {
  ie = new to({
    icon: je.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: je.join(Qn, "preload.mjs")
    },
    show: !1
  }), console.log(je.join(Qn, "preload.mjs")), ie.webContents.on("did-finish-load", () => {
    ie == null || ie.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Mn ? (ie.loadURL(Mn), console.log("VITE_DEV_SERVER_URL: ", Mn), ie.webContents.openDevTools({ mode: "detach" })) : (ie.loadFile(je.join(eo, "index.html")), ie.webContents.openDevTools({ mode: "detach" }), console.log("RENDERER_DIST: ", je.join(eo, "index.html"))), ie == null || ie.setAutoHideMenuBar(!0);
}
vt.on("window-all-closed", () => {
  process.platform !== "darwin" && (vt.quit(), ie = null);
});
vt.on("activate", () => {
  to.getAllWindows().length === 0 && ed();
});
Mt.autoUpdater.logger = zf;
Mt.autoUpdater.on("update-available", (e) => {
  ie == null || ie.webContents.send("update_available", {
    version: e.version,
    releaseNotes: e.releaseNotes || "",
    releaseName: e.releaseName || ""
  });
});
Mt.autoUpdater.on("download-progress", (e) => {
  ie == null || ie.webContents.send("update_download_progress", e.percent);
});
Mt.autoUpdater.on("update-downloaded", () => {
  ie == null || ie.webContents.send("update_downloaded");
});
K.handle("get-app-version", () => vt.getVersion());
vt.whenReady().then(() => {
  console.log("Creating Window"), eA(), ed(), zf.info("App starting..."), Mt.autoUpdater.checkForUpdates();
  const e = new Promise((t) => setTimeout(t, 2e3));
  K.on("app-ready", async () => {
    await e, await (xe == null ? void 0 : xe.webContents.executeJavaScript(`
      document.body.style.transition = 'opacity 0.5s';
      document.body.style.opacity = '0';
      setTimeout(() => window.close(), 5000);
    `)), xe == null || xe.close(), xe = null, ie == null || ie.show();
  }), K.on("restart_app", () => {
    Mt.autoUpdater.quitAndInstall();
  }), K.on("log", (t, ...r) => {
    console.log("\x1B[32m%s\x1B[0m", "[Renderer Log]:", ...r);
  }), K.handle("open-file", async (t, r) => await sh.openPath(r)), K.handle("save-temp-file", async (t, r, n) => await QS(r, n)), K.handle("database:insert-audit", (t, r) => Dh(r)), K.handle("database:get-all-audits", () => Ph()), K.handle("database:get-unsynced-audits", () => Fh()), K.handle("database:update-audit-sync", (t, r) => Lh(r)), K.handle("database:insert-client", (t, r) => ph(r)), K.handle("database:get-all-clients", () => mh()), K.handle("database:update-client-field", (t, r, n, i) => gh(r, n, i)), K.handle("database:delete-client", (t, r) => Eh(r)), K.handle("database:insert-case", (t, r) => wh(r)), K.handle("database:get-all-cases", () => Th()), K.handle("database:delete-case", (t, r) => Ah(r)), K.handle("database:update-case", (t, r, n, i) => Sh(r, n, i)), K.handle("database:insert-task", (t, r) => Rh(r)), K.handle("database:get-all-tasks", () => Ih()), K.handle("database:delete-task", (t, r) => Nh(r)), K.handle("database:update-task", (t, r) => $h(r)), K.handle("get-courts", () => OS()), K.handle("get-tags", () => CS()), K.handle("insert-court", (t, r, n, i) => DS(r, n, i)), K.handle("insert-tag", (t, r, n, i) => PS(r, n, i)), K.handle("update-court-sync", (t, r) => RS(r)), K.handle("update-tag-sync", (t, r) => IS(r)), K.handle("unsynced-courts", () => NS()), K.handle("unsynced-tags", () => $S()), K.handle("unsynced-clients", () => yh()), K.handle("update-client-sync", (t, r) => vh(r)), K.handle("insert-or-update-clients", (t, r) => _h(r)), K.handle("unsynced-cases", () => bh()), K.handle("update-case-sync", (t, r) => Oh(r)), K.handle("insert-or-update-cases", (t, r) => Ch(r)), K.handle("admin:delete-user", async (t, r) => {
    const n = await FS(r);
    return console.log(n), n;
  });
});
export {
  AA as MAIN_DIST,
  eo as RENDERER_DIST,
  Zf as SPLASH_DIST,
  Mn as VITE_DEV_SERVER_URL
};
