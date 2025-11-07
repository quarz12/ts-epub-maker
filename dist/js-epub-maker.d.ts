
interface Section {
    epubType: string;
    id: string | number;
    content: { title: string; content: string; renderTitle?: boolean } | null;
    includeInToc: boolean;
    includeInLandmarks: boolean;
    subSections: Section[];
    withSubSection(subsection: Section): Section;
    collectToc(): Section[];
    collectLandmarks(): Section[];
}

export default class EpubMaker {
    static Section: {
        new (
            epubType: string | null,
            id: string | number,
            content: { title: string; content: string; renderTitle?: boolean } | null,
            includeInToc: boolean,
            includeInLandmarks: boolean
        ): Section;
    };
    withUuid(uuid: string): this;
    withTemplate(templateName: string): this;
    withTitle(title: string): this;
    withLanguage(lang: string): this;
    withAuthor(fullName: string): this;
    withModificationDate(date: Date): this;
    withRights(rights: string): this;
    withCover(coverUrl: string, coverrights: string): this;
    withAttributionUrl(url: string): this;
    withStylesheetUrl(url: string): this;
    withSection(section: Section): this;
    makeEpub(): Promise<Blob>;
    downloadEpub(callback?: ((filecontent, filename)=>void)): void;
    epubConfig : {
        toc: Section[];
        landmarks: Section[];
        sections: Section[];
        stylesheet: {
            url?: string;
            styles?: string;
            replaceOriginal?: boolean;
        };};
}