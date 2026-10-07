import { randomIndex, randomItem, select } from "./rng";
import { decompressUrl } from "./util";
import { get, set, del } from "idb-keyval";

export type UrlType = "alive" | "dead" | "both";

interface Option {
    url: string;
    category: string;
}

const version = "2";

export default new class URLs {
    aliveUrls: Record<string, string[]> = {};
    deadUrls: Record<string, string[]> = {};
    totalAlive = $state(0);
    totalDead = $state(0);
    currentUrl: Option | null = $state(null);
    backStack: Option[] = $state([]);
    nextStack: Option[] = [];
    categories: string[] = $state([]);
    category = $state("*");
    includeDead: UrlType = $state("alive");
    errored = $state(false);
    total = $derived.by(() => {
        if(this.category === "*") {
            if(this.includeDead === "alive") return this.totalAlive;
            if(this.includeDead === "dead") return this.totalDead;
            return this.totalAlive + this.totalDead;
        } else {
            const alive = this.aliveUrls[this.category].length;
            const dead = this.deadUrls[this.category].length;
            if(this.includeDead === "alive") return alive;
            if(this.includeDead === "dead") return dead;
            return alive + dead;
        }
    });

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
        // const savedVersion = localStorage.getItem("urls-version");
        const savedVersion: string = "swag";

        if(savedVersion === version) {
            const saved = await get<File>("urls.txt");

            if(saved) {
                const text = await saved.text();
                this.loadText(text);
            } else {
                await this.fetch();
            }
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

    onSettingsChange() {
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
        localStorage.setItem("urls-version", version);
    }

    loadText(text: string) {
        const urls = text.split("\n");
    
        const header = urls.shift();
        if(!header) return;

        const parts = header.split(",");

        let startIndex = 0;
        for(let i = 0; i < parts.length; i += 3) {
            const aliveCount = Number(parts[i]);
            const deadCount = Number(parts[i + 1]);
            const category = parts[i + 2];
            this.categories.push(category);

            this.aliveUrls[category] = urls.slice(startIndex, startIndex + aliveCount);
            startIndex += aliveCount;
            this.totalAlive += aliveCount;

            this.deadUrls[category] = urls.slice(startIndex, startIndex + deadCount);
            startIndex += deadCount;
            this.totalDead += deadCount;
        }

        console.log(this.aliveUrls, this.deadUrls);
    }

    getUrl(): Option {
        if(this.category !== "*") {
            const alive = this.aliveUrls[this.category];
            const dead = this.deadUrls[this.category];
            const list = select(this.includeDead, alive, dead, alive.length, dead.length);
            
            return {
                url: decompressUrl(randomItem(list)),
                category: this.category
            }
        } else {
            // Get a random category, without being biased by category size
            const urls = select(this.includeDead, this.aliveUrls, this.deadUrls, this.totalAlive, this.totalDead);
            const categories = Object.entries(urls);
            let index = randomIndex(categories.reduce((sum, [_, urls]) => sum + urls.length, 0));
            
            let categoryIndex = 0;
            while(index > categories[categoryIndex][1].length) {
                index -= categories[categoryIndex][1].length;
                categoryIndex++;
            }

            const category = categories[categoryIndex][0];
            return {
                url: decompressUrl(urls[category][index]),
                category
            }
        }
    }
}