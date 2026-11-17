// 코드를 수정해서 다시 올릴 때마다 v1 → v2 → v3 처럼 숫자를 올려주세요.
const CACHE_NAME = "couple-cache-v4";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 설치: 앱 화면 파일을 기기에 저장
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// 활성화: 예전 버전 캐시 삭제
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Supabase 통신(로그인·방·게임 데이터)은 절대 저장하지 않고 항상 실시간으로
  if (url.hostname.endsWith("supabase.co")) return;

  // 앱 화면 파일과 Supabase 라이브러리만 저장 대상
  const cacheable =
    url.origin === self.location.origin ||
    url.hostname === "cdn.jsdelivr.net";
  if (!cacheable) return;

  // 인터넷 되면 최신 버전, 안 되면 저장된 버전
  event.respondWith(
    fetch(req)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || caches.match("./index.html"))
      )
  );
});
