import "chromedriver";
import { Builder, By, until, WebDriver } from "selenium-webdriver";

async function login(driver: WebDriver) {
    await driver.get("http://localhost:3000/admin-login");
    await driver.manage().window().maximize();

    await driver.wait(
        until.elementLocated(By.css('input[type="text"]')),
        10000
    );

    await driver.findElement(By.css('input[type="text"]'))
        .sendKeys("admin_local");

    await driver.findElement(By.css('input[type="password"]'))
        .sendKeys("admin123");

    await driver.findElement(By.css('button[type="submit"]'))
        .click();

    await driver.wait(until.urlContains("dashboard"), 10000);

    console.log("✅ Login Successful");
}

async function openSettings(driver: WebDriver) {
    await driver.get("http://localhost:3000/settings");

    await driver.wait(
        until.elementLocated(By.css('input[placeholder="e.g. 15"]')),
        10000
    );
}

async function setInput(driver: WebDriver, placeholder: string, value: string) {
    const input = await driver.findElement(
        By.css(`input[placeholder="${placeholder}"]`)
    );

    // React-safe DOM value modification & event dispatching
    await driver.executeScript(
        `const element = arguments[0];
         const val = arguments[1];
         const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
         valueSetter.call(element, val);
         element.dispatchEvent(new Event('input', { bubbles: true }));
         element.dispatchEvent(new Event('change', { bubbles: true }));`,
        input,
        value
    );

    const val = await input.getAttribute("value");
    console.log(`Input value for placeholder "${placeholder}": "${val}"`);
}

async function clickSave(driver: WebDriver) {
    await driver.sleep(500);
    const button = await driver.findElement(
        By.xpath("//h2[text()='Delivery Settings']/parent::div//button[contains(., 'Save Changes')]")
    );
    await driver.executeScript("arguments[0].click();", button);
}

async function waitForSuccess(driver: WebDriver) {
    await driver.wait(
        until.elementLocated(
            By.xpath("//*[contains(text(),'successfully!')]")
        ),
        10000
    );
}

async function waitForError(driver: WebDriver, text: string) {
    await driver.wait(
        until.elementLocated(
            By.xpath(`//*[contains(text(),'${text}')]`)
        ),
        10000
    );
}

async function settingDeliveryTest() {
    let driver;
    try {
        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await login(driver);

        // =====================================================
        // TEST CASE 01
        // Valid Settings
        // =====================================================
        console.log("\n========== TC01 ==========");
        console.log("Valid Delivery Settings");

        await openSettings(driver);

        await setInput(driver, "e.g. 15", "25");
        await setInput(driver, "e.g. 250", "350");
        await setInput(driver, "e.g. 6.9271", "6.9275");
        await setInput(driver, "e.g. 79.8612", "79.8615");

        await clickSave(driver);
        await waitForSuccess(driver);

        console.log("✅ TC01 Passed");

        // =====================================================
        // TEST CASE 02
        // Negative Radius
        // =====================================================
        console.log("\n========== TC02 ==========");
        console.log("Negative Delivery Radius");

        await openSettings(driver);
        await setInput(driver, "e.g. 15", "-10");

        await clickSave(driver);
        await waitForError(
            driver,
            "Delivery Radius must be a valid non-negative integer."
        );

        console.log("✅ TC02 Passed");

        // =====================================================
        // TEST CASE 03
        // Empty Delivery Fee
        // =====================================================
        console.log("\n========== TC03 ==========");
        console.log("Empty Delivery Fee");

        await openSettings(driver);
        await setInput(driver, "e.g. 15", "20");
        await setInput(driver, "e.g. 250", "");

        await clickSave(driver);
        await waitForError(
            driver,
            "Base Delivery Fee must be a valid non-negative number."
        );

        console.log("✅ TC03 Passed");

        // =====================================================
        // TEST CASE 04
        // Invalid Latitude
        // =====================================================
        console.log("\n========== TC04 ==========");
        console.log("Invalid Latitude");

        await openSettings(driver);
        await setInput(driver, "e.g. 6.9271", "abc");

        await clickSave(driver);
        await waitForError(
            driver,
            "Kitchen Latitude must be a valid number."
        );

        console.log("✅ TC04 Passed");

        // =====================================================
        // TEST CASE 05
        // Empty Delivery Radius
        // =====================================================
        console.log("\n========== TC05 ==========");
        console.log("Empty Delivery Radius");

        await openSettings(driver);
        await setInput(driver, "e.g. 15", "");

        await clickSave(driver);
        await waitForError(
            driver,
            "Delivery Radius must be a valid non-negative integer."
        );

        console.log("✅ TC05 Passed");

        // =====================================================
        // TEST CASE 06
        // Non-numeric Delivery Radius
        // =====================================================
        console.log("\n========== TC06 ==========");
        console.log("Non-numeric Delivery Radius");

        await openSettings(driver);
        await setInput(driver, "e.g. 15", "abc");

        await clickSave(driver);
        await waitForError(
            driver,
            "Delivery Radius must be a valid non-negative integer."
        );

        console.log("✅ TC06 Passed");

        // =====================================================
        // TEST CASE 07
        // Negative Delivery Fee
        // =====================================================
        console.log("\n========== TC07 ==========");
        console.log("Negative Delivery Fee");

        await openSettings(driver);
        await setInput(driver, "e.g. 250", "-50");

        await clickSave(driver);
        await waitForError(
            driver,
            "Base Delivery Fee must be a valid non-negative number."
        );

        console.log("✅ TC07 Passed");

        // =====================================================
        // TEST CASE 08
        // Empty Kitchen Longitude
        // =====================================================
        console.log("\n========== TC08 ==========");
        console.log("Empty Kitchen Longitude");

        await openSettings(driver);
        await setInput(driver, "e.g. 79.8612", "");

        await clickSave(driver);
        await waitForError(
            driver,
            "Kitchen Longitude must be a valid number."
        );

        console.log("✅ TC08 Passed");

        // =====================================================
        // TEST CASE 09
        // Invalid Kitchen Longitude
        // =====================================================
        console.log("\n========== TC09 ==========");
        console.log("Invalid Kitchen Longitude");

        await openSettings(driver);
        await setInput(driver, "e.g. 79.8612", "abc");

        await clickSave(driver);
        await waitForError(
            driver,
            "Kitchen Longitude must be a valid number."
        );

        console.log("✅ TC09 Passed");

        // =====================================================
        // TEST CASE 10
        // Empty Kitchen Latitude
        // =====================================================
        console.log("\n========== TC10 ==========");
        console.log("Empty Kitchen Latitude");

        await openSettings(driver);
        await setInput(driver, "e.g. 6.9271", "");

        await clickSave(driver);
        await waitForError(
            driver,
            "Kitchen Latitude must be a valid number."
        );

        console.log("✅ TC10 Passed");

        console.log("\n🎉 All Delivery Settings Test Cases Passed Successfully!");
        await driver.sleep(3000);

    } catch (error) {
        console.log("\n❌ Test Failed");
        console.error(error);

        if (driver) {
            try {
                const bodyText = await driver.findElement(By.css("body")).getText();
                console.log("\n--- Page Body Text at Failure ---");
                console.log(bodyText);
                console.log("---------------------------------\n");
            } catch (e) {
                const error = e as Error;
                console.log("Could not retrieve page body text:", error.message);
            }

            try {
                const logs = await driver.manage().logs().get("browser");
                console.log("--- Browser Console Logs ---");
                for (const entry of logs) {
                    console.log(`[${entry.level.name}] ${entry.message}`);
                }
                console.log("-----------------------------\n");
            } catch (e) {
                const error = e as Error;
                console.log("Could not retrieve browser logs:", error.message);
            }
        }
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

settingDeliveryTest();
