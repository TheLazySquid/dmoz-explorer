import { decompressUrl } from "./util";
import { get, set, del } from "idb-keyval";

interface Option {
    url: string;
    category: string;
}

export default new class URLs {
    urls: Record<string, string[]> = {};
    totalUrls = $state(0);
    currentUrl: Option | null = $state(null);
    backStack: Option[] = $state([]);
    nextStack: Option[] = [];
    categories: string[] = $state([]);
    category = $state("*");
    errored = $state(false);

    constructor() {
        try {
            this.load();
        } catch {
            this.errored = true;

            // Just in case something got corrupted
            del("urls.txt");
        }
    }

    async load() {
        const saved = await get<File>("urls.txt");
        
        if(saved) {
            const text = await saved.text();
            this.loadText(text);
        } else {
            await this.fetch();
        }

        this.next();
    }
    
    next() {
        if(this.currentUrl) {
            this.backStack.push(this.currentUrl);
            if(this.backStack.length > 1000) this.backStack.shift();
        }

        if(this.nextStack.length > 0) {
            this.currentUrl = this.nextStack.pop()!;
        } else {
            this.currentUrl = this.getUrl();
        }
    }

    back() {
        const previous = this.backStack.pop();
        if(!previous || !this.currentUrl) return;

        this.nextStack.push(this.currentUrl);
        this.currentUrl = previous;
    }

    updateCategory() {
        this.backStack = [];
        this.nextStack = [];
        this.currentUrl = this.getUrl();
    }

    async fetch() {
        const res = await fetch("/dmoz-explorer/urls.txt")
        const text = await res.text();    

        this.loadText(text);

        const file = new File([text], "urls.txt", { type: "text/plain" });
        set("urls.txt", file);
    }

    loadText(text: string) {
        const urls = text.split("\n");
    
        const header = urls.shift();
        if(!header) return;

        const parts = header.split(",");
        this.totalUrls = urls.length;

        let startIndex = 0;
        for(let i = 0; i < parts.length; i += 2) {
            const length = Number(parts[i]);
            const category = parts[i + 1];
            this.categories.push(category);

            this.urls[category] = urls.slice(startIndex, startIndex + length);
            startIndex += length;
        }
    }

    getUrl(): Option {
        if(this.category !== "*") {
            const list = this.urls[this.category];
            const index = Math.floor(Math.random() * list.length);
            
            return {
                url: decompressUrl(list[index]),
                category: this.category
            }
        } else {
            // Get a random category, without being biased by category size
            const categories = Object.entries(this.urls);
            let index = Math.floor(Math.random() * this.totalUrls);
            
            let categoryIndex = 0;
            while(index > categories[categoryIndex][1].length) {
                index -= categories[categoryIndex][1].length;
                categoryIndex++;
            }

            const category = categories[categoryIndex][0];
            return {
                url: decompressUrl(this.urls[category][index]),
                category
            }
        }
    }
}