const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
const extensions = [".com", ".org", ".uk", ".edu", ".net", ".ca", ".au"]; // the seven most common for some reason

export function compressUrl(url: string) {
    let prefix = 0;

    // Remove the protocol
    if(url.startsWith("http://")) {
        prefix |= 1;
        url = url.slice(7);
    } else {
        url = url.slice(8);
    }

    // Remove a www prefix
    if(url.startsWith("www.")) {
        prefix |= 2;
        url = url.slice(4);
    }

    // Remove a trailing .html
    if(url.endsWith(".html")) {
        prefix |= 4;
        url = url.slice(0, -5);
    }

    let extEnd = url.indexOf("/");
    if(extEnd === -1) extEnd = url.length;
    const extStart = url.lastIndexOf(".", extEnd);
    const extension = url.slice(extStart, extEnd);
    const extIndex = extensions.indexOf(extension) + 1;

    if(extIndex !== 0) {
        prefix += extIndex << 3;
        url = url.slice(0, extStart) + url.slice(extEnd);
    }

    return chars[prefix] + url;
}

export function decompressUrl(compressed: string) {
    const prefixChar = compressed[0];
    const prefix = chars.indexOf(prefixChar);
    compressed = compressed.slice(1);

    if(prefix > 7) {
        const extIndex = (prefix >> 3) - 1;
        const extension = extensions[extIndex];

        let extEnd = compressed.indexOf("/");
        if(extEnd === -1) extEnd = compressed.length;
        compressed = compressed.slice(0, extEnd) + extension + compressed.slice(extEnd);
    }
    if(prefix & 4) compressed += ".html";
    if(prefix & 2) compressed = "www." + compressed;
    if(prefix & 1) compressed = "http://" + compressed;
    else compressed = "https://" + compressed;

    return compressed;
}