//
//  russ5UITests.swift
//  russ5UITests
//
//  Created by Alex Newman on 5/18/25.
//

import XCTest

final class russ5UITests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
        let app = XCUIApplication()
        app.launchArguments += ["-UITesting"] // General argument, could be used for various setup
        // Consider adding: app.launchArguments += ["-ClearHistoryOnInit"] if you implement clearing logic
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    @MainActor
    func testExample() throws {
        // UI tests must launch the application that they test.
        let app = XCUIApplication()
        app.launch()

        // Use XCTAssert and related functions to verify your tests produce the correct results.
    }
    
    @MainActor
    func testHistoryLoggingEndToEnd() throws {
        // 1. Clear history from the app first (if possible, or ensure a clean state)
        // For now, we'll assume a relatively clean state or that previous items don't interfere.
        // A more robust test would clear data, but that requires app-side hooks or specific test setups.

        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.launch()

        // Give Safari a moment to fully launch
        XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 10))

        // Navigate to a URL in Safari
        // This part is tricky as directly controlling Safari's URL bar is complex in UI tests.
        // A common workaround is to use `open(_:)` on XCUIApplication for your own app
        // with a URL scheme that then opens Safari, or to manually navigate if running on a device.
        // For automated tests, we often rely on deep linking if available or a helper app.
        //
        // Simpler approach for now: Assume we can tell Safari to open a URL.
        // This specific `open(URL)` is for the SUT (System Under Test), not arbitrary apps.
        // So, this direct Safari URL opening might not work as expected from XCUIApplication.
        //
        // A more reliable way to open a URL in Safari from a test is often to
        // have your own app open it via UIApplication.shared.open.
        // However, for a pure UI test starting with Safari:
        // We will try to tap the URL bar, type, and go.

        // Tap the URL bar (this often changes based on iOS version and Safari layout)
        // This is a common point of failure and may need adjustment.
        // Let's try finding the "URL" text field or a button that represents it.
        // If Safari is fresh, it might show "Search or enter website name"
        let urlTextField = safari.textFields["URL"] // Common accessibility label
        let addressBar = safari.otherElements["Address"] // Another possibility
        let searchOrEnterWebsiteField = safari.textFields["Search or enter website name"]
        
        let targetElement: XCUIElement
        if urlTextField.exists {
            targetElement = urlTextField
        } else if addressBar.exists {
            targetElement = addressBar
        } else if searchOrEnterWebsiteField.exists {
            targetElement = searchOrEnterWebsiteField
        } else {
            // Fallback if common labels aren't found
            // This might require manual inspection of Safari's UI hierarchy
            // using the Accessibility Inspector or `debugDescription`
            XCTFail("Could not find Safari URL bar. Test needs adjustment.")
            return // Exit test if we can't find it
        }

        targetElement.tap()
        
        // Sometimes there's a "Clear text" button if there's existing text
        let clearTextButton = safari.buttons["Clear text"]
        if clearTextButton.exists {
            clearTextButton.tap()
        }
        
        targetElement.typeText("https://www.apple.com\n") // \n to simulate 'Go'

        // Wait for a few seconds to allow the page to load and the extension to log history
        // This is a brittle part of the test; explicit waits for elements are better if possible.
        sleep(10) // Increase if needed, but explicit waits are preferred.

        // Terminate Safari to ensure it's not interfering or that the extension has flushed its data
        safari.terminate()

        // Launch your app
        let app = XCUIApplication() // This refers to your russ5 app
        // We need to ensure the app's UserDefaults are fresh or the item isn't already there.
        // For now, let's clear history via a button if we add one, or assume it.
        
        // To ensure data is fresh for the test, ideally, we'd clear HistoryDatabase.
        // Since UI tests run in a separate process, directly calling HistoryDatabase.clear() isn't easy.
        // Options:
        // 1. Add a UI element in the app (DEBUG only) to clear history.
        // 2. Use launch arguments to tell the app to clear history on launch FOR TESTING.
        // For now, we'll proceed without this, but be aware it might pick up old data.

        app.launch() // This will use the launchArguments from setUpWithError
        
        // Wait for the app to launch and load data
        // Check if the table view exists
        let historyTable = app.tables.firstMatch // Assumes one table view
        XCTAssertTrue(historyTable.waitForExistence(timeout: 10), "History table view did not appear.")

        // Check for the logged history item
        // We look for a cell that contains "apple.com" or the title "Apple"
        // The exact text depends on what your extension logs and how cells are populated.
        // Assuming detailTextLabel shows the host or URL.
        let appleCell = historyTable.cells.containing(.staticText, identifier: "apple.com").firstMatch
        // Or, if the title "Apple" is reliably fetched:
        // let appleCell = historyTable.cells.containing(.staticText, identifier: "Apple").firstMatch
        
        XCTAssertTrue(appleCell.waitForExistence(timeout: 15), "History item for apple.com not found in the app.")
    }

    @MainActor
    func testHistoryItemAppearsAfterBrowsing() throws {
        let app = XCUIApplication()
        app.launch()

        // **Manual Prerequisite for this test version:**
        // 1. Manually open Safari.
        // 2. Navigate to a known URL, e.g., "https://www.apple.com".
        // 3. Ensure the russ5 extension is active and has permission.
        // 4. Switch back to the russ5 app (or re-run this test which will relaunch it).

        // The app should now display the history.
        // We expect to find a cell containing "apple.com" or the title of the Apple page.
        
        // Give the app a moment to load data if it's async (though current loadHistory is sync)
        // and for UI to update.
        let expectedHostname = "apple.com" // Or a part of the title.
        
        // Wait for the table and then for a cell that contains the expected text.
        // Tables and cells are common elements.
        let historyTable = app.tables.firstMatch
        XCTAssertTrue(historyTable.waitForExistence(timeout: 10), "History table should exist.")

        // Now, try to find a cell that contains text from the visited site.
        // This predicate searches for any static text within cells that contains the hostname.
        // Note: Accessibility identifiers on cells would make this much more robust.
        let predicate = NSPredicate(format: "label CONTAINS[c] %@", expectedHostname)
        let cellWithExpectedText = historyTable.cells.containing(predicate).firstMatch
        
        // We'll assert that such a cell exists. If browsing didn't happen or wasn't logged,
        // this will fail.
        XCTAssertTrue(cellWithExpectedText.waitForExistence(timeout: 15), "Cell containing '\(expectedHostname)' not found. Ensure you browsed to the site in Safari with the extension active, then re-run the test or ensure the app was re-focused.")
        
        // Optional: Tap the cell if you want to test navigation (if implemented)
        // cellWithExpectedText.tap()
    }

    @MainActor
    func testLaunchPerformance() throws {
        // This measures how long it takes to launch your application.
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
