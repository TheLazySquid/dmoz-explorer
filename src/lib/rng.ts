import type { UrlType } from "./urls.svelte";

export function select<T>(type: UrlType, alive: T, dead: T, aliveWeight: number, deadWeight: number) {
    if(type === "alive") return alive;
    if(type === "dead") return dead;

    const totalWeight = aliveWeight + deadWeight;
    return Math.random() < aliveWeight / totalWeight ? alive : dead;
}

export function randomIndex(length: number) {
    return Math.floor(Math.random() * length);
}

export function randomItem<T>(array: T[]) {
    return array[randomIndex(array.length)];
}