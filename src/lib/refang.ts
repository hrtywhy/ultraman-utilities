export function refangText(s: string): string {
  return s
    .replace(/hxxps\[:\]\/\//gi, 'https://')
    .replace(/hxxp\[:\]\/\//gi, 'http://')
    .replace(/fxp\[:\]\/\//gi, 'ftp://')
    .replace(/hxxps:\/\//gi, 'https://')
    .replace(/hxxp:\/\//gi, 'http://')
    .replace(/\[\.\]/gi, '.')
    .replace(/\(\.\)/gi, '.')
    .replace(/\[at\]/gi, '@')
    .replace(/\[@\]/gi, '@')
    .replace(/\[:\]/gi, ':');
}

export function defangText(s: string): string {
  return s
    .replace(/https:\/\//gi, 'hxxps[:]//')
    .replace(/http:\/\//gi, 'hxxp[:]//')
    .replace(/ftp:\/\//gi, 'fxp[:]//')
    .replace(/(?<=\S)@(?=\S)/g, '[@]')
    .replace(/\./g, '[.]');
}
