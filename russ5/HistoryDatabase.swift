import Foundation

class HistoryDatabase {
    static let shared = HistoryDatabase()
    private let defaults: UserDefaults?
    private let historyKey = "webHistory"

    private init() {
        // IMPORTANT: Replace "group.xyz.russ.russ5" with your actual App Group identifier
        defaults = UserDefaults(suiteName: "group.xyz.russ.russ5")
    }

    func addHistoryItem(url: URL, title: String?) {
        let newItem = WebHistoryItem(url: url, title: title)
        var history = getHistory()
        history.insert(newItem, at: 0) // Add to the top for recent first

        // Keep history to a reasonable size, e.g., last 100 items
        if history.count > 100 {
            history = Array(history.prefix(100))
        }
        
        saveHistory(history)
    }

    func getHistory() -> [WebHistoryItem] {
        guard let defaults = defaults else {
            print("Error: UserDefaults suite not found.")
            return []
        }
        if let savedData = defaults.data(forKey: historyKey) {
            let decoder = JSONDecoder()
            if let loadedHistory = try? decoder.decode([WebHistoryItem].self, from: savedData) {
                return loadedHistory
            }
        }
        return []
    }

    private func saveHistory(_ history: [WebHistoryItem]) {
        guard let defaults = defaults else {
            print("Error: UserDefaults suite not found for saving.")
            return
        }
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(history) {
            defaults.set(encoded, forKey: historyKey)
        } else {
            print("Error: Could not encode history for saving.")
        }
    }
    
    func clearHistory() {
        guard let defaults = defaults else {
            print("Error: UserDefaults suite not found for clearing.")
            return
        }
        defaults.removeObject(forKey: historyKey)
    }
}
