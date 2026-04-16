export function queryText(selector: string, root: ParentNode = document) {
    return root.querySelector(selector)?.textContent?.trim() ?? null;
}

export function queryAllText(selector: string, root: ParentNode = document) {
    return Array.from(root.querySelectorAll(selector))
        .map((element) => element.textContent?.trim() ?? '')
        .filter(Boolean);
}

export function queryAttribute(selector: string, attribute: string, root: ParentNode = document) {
    return root.querySelector(selector)?.getAttribute(attribute) ?? null;
}
