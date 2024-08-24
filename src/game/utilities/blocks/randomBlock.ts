import { BLOCKS } from "../../../config/config";

/**
 * Returns a random block from the BLOCKS array.
 * @returns {string} a random block from the BLOCKS array.
 */
export function getRandomBlock(): string {
    const randomIndex = Math.floor(Math.random() * BLOCKS.length);
    return BLOCKS[randomIndex];
}