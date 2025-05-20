import Foundation

struct WebHistoryItem: Codable, Identifiable {
    let id: UUID
    let url: URL
    let title: String?
    let timestamp: Date
    let pageDescription: String?
    let previewImageURL: URL?
    let faviconURL: URL?
    let articleText: String?

    init(id: UUID = UUID(), url: URL, title: String? = nil, timestamp: Date = Date(), pageDescription: String? = nil, previewImageURL: URL? = nil, faviconURL: URL? = nil, articleText: String? = nil) {
        self.id = id
        self.url = url
        self.title = title
        self.timestamp = timestamp
        self.pageDescription = pageDescription
        self.previewImageURL = previewImageURL
        self.faviconURL = faviconURL
        self.articleText = articleText
    }
}
