// A standalone page for devices too old to run the main site's JavaScript
// (iOS < 12). It behaves like the Android TV app: shows a pairing code, polls
// for casts, and loads the cast into a full-screen frame. Deliberately plain
// HTML + ES5 so Safari 9 can run it.
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Venus TV</title>
<style>
html,body{margin:0;height:100%;background:#000;color:#fff;font-family:-apple-system,Helvetica,Arial,sans-serif}
#info{position:absolute;top:0;left:0;right:0;bottom:0;text-align:center;padding-top:12%}
#title{font-size:28px;color:#ec4899;margin-bottom:24px}
#code{font-size:72px;letter-spacing:12px;font-family:Menlo,Courier,monospace;margin:24px 0}
#status{font-size:20px;color:#a1a1aa;padding:0 24px}
#hint{font-size:16px;color:#71717a;margin-top:32px;padding:0 24px}
#player{display:none;position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:#000}
</style>
</head>
<body>
<div id="info">
  <div id="title">Venus TV</div>
  <div id="code"></div>
  <div id="status">Starting...</div>
  <div id="hint">On your phone, open the Venus site, go to TV, and enter this code.</div>
</div>
<iframe id="player" allowfullscreen></iframe>
<script>
(function () {
  var KEY = "venus_tv_device_token";
  var POLL_MS = 3000;
  var token = null;
  var lastIssued = null;
  var codeShown = false;
  var codeShownAt = 0;
  var codeEl = document.getElementById("code");
  var statusEl = document.getElementById("status");
  var hintEl = document.getElementById("hint");
  var infoEl = document.getElementById("info");
  var playerEl = document.getElementById("player");

  try { token = window.localStorage.getItem(KEY); } catch (e) {}

  function request(method, url, cb) {
    var x = new XMLHttpRequest();
    x.open(method, url, true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      var body = null;
      try { body = JSON.parse(x.responseText); } catch (e) {}
      cb(x.status, body);
    };
    if (method === "POST") {
      x.setRequestHeader("Content-Type", "application/json");
      x.send("{}");
    } else {
      x.send(null);
    }
  }

  function showCode() {
    playerEl.style.display = "none";
    playerEl.src = "about:blank";
    infoEl.style.display = "block";
    hintEl.style.display = "block";
  }

  function register() {
    codeShown = false;
    lastIssued = null;
    statusEl.textContent = "Getting a code...";
    request("POST", "/api/tv/register", function (status, body) {
      if (status === 200 && body && body.deviceToken) {
        token = body.deviceToken;
        try { window.localStorage.setItem(KEY, token); } catch (e) {}
        codeShown = true;
        codeShownAt = new Date().getTime();
        codeEl.textContent = body.code;
        statusEl.textContent = "Waiting for your phone...";
        showCode();
      } else {
        statusEl.textContent = "Can't reach Venus. Retrying...";
      }
      schedule();
    });
  }

  function embedUrl(c) {
    var path = c.mediaType === "tv"
      ? "/tv-embed/tv/" + c.tmdbId + "/" + (c.season || 1) + "/" + (c.episode || 1)
      : "/tv-embed/movie/" + c.tmdbId;
    return path + "?token=" + encodeURIComponent(c.viewToken);
  }

  function poll() {
    if (!token) { register(); return; }
    request("GET", "/api/tv/poll?device_token=" + encodeURIComponent(token), function (status, body) {
      if (status === 404) {
        token = null;
        try { window.localStorage.removeItem(KEY); } catch (e) {}
        register();
        return;
      }
      if (body && body.paired === false) {
        if (!codeShown) { register(); return; }
        // The code is only valid for 10 minutes; get a fresh one before then.
        if (new Date().getTime() - codeShownAt > 9 * 60 * 1000) { register(); return; }
      } else if (body && body.paired) {
        codeEl.textContent = "";
        statusEl.textContent = "Connected. Cast something from your phone.";
        hintEl.style.display = "none";
        var c = body.cast;
        if (c && c.issuedAt && c.issuedAt !== lastIssued && c.viewToken) {
          lastIssued = c.issuedAt;
          infoEl.style.display = "none";
          playerEl.style.display = "block";
          playerEl.src = embedUrl(c);
        }
      }
      schedule();
    });
  }

  function schedule() { window.setTimeout(poll, POLL_MS); }

  poll();
})();
</script>
</body>
</html>`;

export function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
