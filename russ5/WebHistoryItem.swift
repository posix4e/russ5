import Foundation

struct WebHistoryItem: Codable, Identifiable {
    let id: UUID
    let url: URL
    let title: String? // Optional: content script might not always get it easily
    let timestamp: Date

    init(id: UUID = UUID(), url: URL, title: String? = nil, timestamp: Date = Date()) {
        self.id = id
        self.url = url
        self.title = title
        self.timestamp = timestamp
    }
}