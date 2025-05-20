//
//  SafariWebExtensionHandler.swift
//  russ5 Extension
//
//  Created by Alex Newman on 5/18/25.
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        let response = NSExtensionItem()
        var responseMessage: [String: Any] = ["echo": message ?? "No message received"]

        if let messageDict = message as? [String: Any], let type = messageDict["type"] as? String {
            switch type {
            case "logHistory":
                if let urlString = messageDict["url"] as? String, let url = URL(string: urlString) {
                    let title = messageDict["title"] as? String
                    let pageDescription = messageDict["description"] as? String
                    let previewImageURLString = messageDict["previewImageURL"] as? String
                    let previewImageURL = URL(string: previewImageURLString ?? "")
                    let faviconURLString = messageDict["faviconURL"] as? String
                    let faviconURL = URL(string: faviconURLString ?? "")
                    let articleText = messageDict["articleText"] as? String

                    HistoryDatabase.shared.addHistoryItem(url: url, title: title, pageDescription: pageDescription, previewImageURL: previewImageURL, faviconURL: faviconURL, articleText: articleText)
                    responseMessage = ["status": "success", "action": "logHistory"]
                    os_log(.default, "Logged history for URL: %@. Article text length: %d", urlString, articleText?.count ?? 0)
                } else {
                    responseMessage = ["status": "error", "message": "Invalid URL for logHistory"]
                    os_log(.error, "Failed to log history: Invalid URL")
                }
            case "getHistory":
                let historyItems = HistoryDatabase.shared.getHistory()
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                if let historyData = try? encoder.encode(historyItems),
                   let historyJSON = try? JSONSerialization.jsonObject(with: historyData, options: []) {
                    responseMessage = ["status": "success", "action": "getHistory", "history": historyJSON]
                    os_log(.default, "Fetched %d history items", historyItems.count)
                } else {
                    responseMessage = ["status": "error", "message": "Failed to serialize history"]
                    os_log(.error, "Failed to serialize history for getHistory")
                }
            default:
                os_log(.default, "Unknown message type: %@", type)
                responseMessage = ["status": "error", "message": "Unknown message type: \(type)"]
            }
        } else {
            os_log(.default, "Received non-dictionary or typeless message: %@", String(describing: message))
        }

        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [ SFExtensionMessageKey: responseMessage ]
        } else {
            response.userInfo = [ "message": responseMessage ]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }

}
