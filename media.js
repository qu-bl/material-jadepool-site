/* Shared data contract for external links and official video embeds. */
(function (root) {
  function webUrl(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
  function videoSource(video) {
    if (!video || typeof video.id !== 'string') return null;
    const id = video.id;
    let embed, href;
    if (video.platform === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      embed = `https://www.youtube.com/embed/${id}?autoplay=0&playsinline=1`;
      href = `https://www.youtube.com/watch?v=${id}`;
    } else if (video.platform === 'bilibili' && /^BV[A-Za-z0-9]{10}$/.test(id)) {
      embed = `https://player.bilibili.com/player.html?bvid=${id}&autoplay=0&danmaku=0`;
      href = `https://www.bilibili.com/video/${id}/`;
    } else if (video.platform === 'douyin' && /^\d{10,25}$/.test(id)) {
      embed = `https://open.douyin.com/player/video?vid=${id}&autoplay=0`;
      href = `https://www.douyin.com/video/${id}`;
    } else return null;
    const ratio = typeof video.aspectRatio === 'number' && video.aspectRatio >= .4 && video.aspectRatio <= 2.4 ? video.aspectRatio : 16 / 9;
    return {embed, href, ratio, platform: video.platform};
  }
  function accessAction(item) {
    const value = item.url || item.value;
    if (item.copyable === false || typeof value !== 'string' || !value.trim() || /待发布|待替换|展示样例/.test(value)) return {type:'unavailable'};
    const href = webUrl(value);
    if (item.action === 'copy' || item.platform === 'qq') return {type:'copy', value};
    if (href) return {type:'link', href};
    if (item.action === 'link' || /^[a-z][a-z\d+.-]*:/i.test(value)) return {type:'unavailable'};
    return {type:'copy', value};
  }
  root.SiteMedia = {webUrl, videoSource, accessAction};
})(globalThis);
