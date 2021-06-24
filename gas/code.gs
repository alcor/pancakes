function doGet(e) {
  var parameters = e.parameters;

  var toc = Docs.Documents.get(parameters.toc);

  //var cache = CacheService.getScriptCache();
  //if (!ignoreCache && (cached = cache.get(toc)) != null) {    
  //  return cached; 
  //} 
  
  var template = HtmlService.createTemplateFromFile('gs/index')
  template.toc = toc

  let obj = Object.values(toc.inlineObjects).pop()
  let img = obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri;
  Logger.log(img)
  template.img = img + "?.png"
  let output = template.evaluate();

  //cache.put(toc, output, 60);
  let favmoji;
  var favicon = template.img || `https://ssl.gstatic.com/dynamite/emoji/png/32/emoji_${favmoji || 'u1f4da'}.png`;
  return output
    .setTitle(toc.title)
    .setFaviconUrl(favicon)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}
