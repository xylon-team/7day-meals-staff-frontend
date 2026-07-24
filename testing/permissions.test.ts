import "chromedriver";
import { Builder, By, until, WebDriver } from "selenium-webdriver";

const BASE_URL = "http://localhost:3000";
const ADMIN_USER = "admin_local";
const ADMIN_PASS = "admin123";

// =====================================================
// Helper Functions
// =====================================================

async function login(driver: WebDriver) {
    await driver.get(`${BASE_URL}/admin-login`);
    await driver.manage().window().maximize();

    await driver.wait(
        until.elementLocated(By.css('input[type="text"]')),
        10000
    );

    await driver.findElement(By.css('input[type="text"]')).sendKeys(ADMIN_USER);
    await driver.findElement(By.css('input[type="password"]')).sendKeys(ADMIN_PASS);
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains("dashboard"), 10000);
    console.log("✅ Login Successful");
}

async function openPermissionsPage(driver: WebDriver) {
    await driver.get(`${BASE_URL}/roles`);
    await driver.wait(
        until.elementLocated(By.xpath("//h2[contains(text(),'Permission Assignment')]")),
        10000
    );
    await driver.sleep(1500); // Sleep for visual tracking
    console.log("📂 Navigated to Permissions Page");
}

async function selectAnyOtherRole(driver: WebDriver, currentRole: string): Promise<string> {
    const dropdownTrigger = await driver.findElement(
        By.xpath("//label[contains(text(),'Select Role')]/following-sibling::button")
    );
    await driver.executeScript("arguments[0].click();", dropdownTrigger);
    await driver.sleep(1500); // Show dropdown open

    // Wait for the dropdown list wrapper to appear
    const wrapperXpath = "//label[contains(text(),'Select Role')]/parent::div/div[contains(@class, 'absolute')]";
    await driver.wait(until.elementLocated(By.xpath(wrapperXpath)), 5000);

    // Wait for the role option buttons to render
    await driver.wait(
        until.elementLocated(By.xpath(`${wrapperXpath}//button`)),
        5000
    );

    // Find all role option buttons
    const buttons = await driver.findElements(
        By.xpath(`${wrapperXpath}//button`)
    );

    let roleToSelect = "";
    let roleOptionElement;

    for (const btn of buttons) {
        const text = await btn.getText();
        if (text !== currentRole) {
            roleToSelect = text;
            roleOptionElement = btn;
            break;
        }
    }

    if (roleOptionElement && roleToSelect) {
        await driver.executeScript("arguments[0].click();", roleOptionElement);
        await driver.sleep(2000); // Wait for permissions to load
        console.log(`👤 Dynamically Selected Other Role: ${roleToSelect}`);
        return roleToSelect;
    } else {
        // If there's only one role, toggle the dropdown closed and keep the current role
        await driver.executeScript("arguments[0].click();", dropdownTrigger);
        await driver.sleep(1500);
        console.log(`👤 Only one role available: ${currentRole}`);
        return currentRole;
    }
}

function getColIndex(action: string): number {
    switch (action) {
        case "add": return 3;
        case "change": return 4;
        case "delete": return 5;
        case "view": return 6;
        default: return 3;
    }
}

async function isCheckboxPresent(driver: WebDriver, moduleCode: string, action: string): Promise<boolean> {
    const colIndex = getColIndex(action);
    const xpath = `//tr[td[1]//span[text()='${moduleCode}']]/td[${colIndex}]//input[@type='checkbox']`;
    try {
        const elements = await driver.findElements(By.xpath(xpath));
        return elements.length > 0;
    } catch {
        return false;
    }
}

async function getCheckboxState(driver: WebDriver, moduleCode: string, action: string): Promise<boolean> {
    const colIndex = getColIndex(action);
    const xpath = `//tr[td[1]//span[text()='${moduleCode}']]/td[${colIndex}]//input[@type='checkbox']`;
    const checkbox = await driver.findElement(By.xpath(xpath));
    return await checkbox.isSelected();
}

async function togglePermissionCheckbox(driver: WebDriver, moduleCode: string, action: string) {
    const colIndex = getColIndex(action);
    const xpath = `//tr[td[1]//span[text()='${moduleCode}']]/td[${colIndex}]//input[@type='checkbox']`;
    const checkbox = await driver.findElement(By.xpath(xpath));
    await driver.executeScript("arguments[0].click();", checkbox);
    await driver.sleep(1500); // Slow down checkbox click
}

async function toggleRowAll(driver: WebDriver, moduleCode: string) {
    const xpath = `//tr[td[1]//span[text()='${moduleCode}']]/td[2]//button`;
    const toggleButton = await driver.findElement(By.xpath(xpath));
    await driver.executeScript("arguments[0].click();", toggleButton);
    await driver.sleep(1500); // Slow down toggle switch click
}

async function isRowAllActive(driver: WebDriver, moduleCode: string): Promise<boolean> {
    const xpath = `//tr[td[1]//span[text()='${moduleCode}']]/td[2]//button`;
    const toggleButton = await driver.findElement(By.xpath(xpath));
    const className = await toggleButton.getAttribute("class");
    return className ? className.includes("bg-primary") : false;
}

async function clickSaveChanges(driver: WebDriver) {
    // Find the Save Changes button
    const button = await driver.findElement(
        By.xpath("//button[contains(., 'Save Changes')]")
    );
    await driver.executeScript("arguments[0].click();", button);
    await driver.sleep(1500); // Slow down save click
    console.log("💾 Clicked Save Changes");
}

async function clickCancel(driver: WebDriver) {
    const button = await driver.findElement(
        By.xpath("//button[contains(., 'Cancel')]")
    );
    await driver.executeScript("arguments[0].click();", button);
    await driver.sleep(1500); // Slow down cancel click
    console.log("↩️ Clicked Cancel");
}

async function waitForToast(driver: WebDriver): Promise<string> {
    const toastElement = await driver.wait(
        until.elementLocated(
            By.xpath("//div[contains(@class, 'fixed') and contains(@class, 'right-5')]//span")
        ),
        10000
    );
    const text = await toastElement.getText();
    console.log(`🔔 Toast Alert Verified: "${text}"`);
    return text;
}

// =====================================================
// Test Execution Suite
// =====================================================

async function permissionsTest() {
    let driver;
    try {
        driver = await new Builder().forBrowser("chrome").build();
        await login(driver);
        await openPermissionsPage(driver);

        // =====================================================
        // TEST CASE 01: Verify Table Layout & Columns
        // =====================================================
        console.log("\n========== TC01 ==========");
        console.log("Verify Permissions Table Layout");

        const tableHeader = await driver.findElement(By.css("table thead tr"));
        const headerText = await tableHeader.getText();
        console.log(`Header columns: ${headerText.replace(/\n/g, ", ")}`);

        if (headerText.includes("PERMISSION") && headerText.includes("ALL") && headerText.includes("ADD") && headerText.includes("VIEW")) {
            console.log("✅ TC01 Passed — Layout and Headers Verified");
        } else {
            throw new Error("TC01 Failed — Missing columns in the permissions table");
        }
        await driver.sleep(2000); // Wait between cases

        // =====================================================
        // TEST CASE 02: Switch Roles and Verify State Load
        // =====================================================
        console.log("\n========== TC02 ==========");
        console.log("Verify Switch Roles Interaction");

        // Find currently selected role first
        const dropdownTriggerBtn = await driver.findElement(
            By.xpath("//label[contains(text(),'Select Role')]/following-sibling::button")
        );
        const currentRoleText = (await dropdownTriggerBtn.getText()).replace("Active", "").trim();
        console.log(`Current active role: "${currentRoleText}"`);

        const selectedRoleText = await selectAnyOtherRole(driver, currentRoleText);

        // Confirm the summary text reflects the active role
        const label = await driver.findElement(By.xpath("//span[contains(text(), 'Editing permissions for:')]"));
        const labelText = await label.getText();
        console.log(`Editing target: "${labelText}"`);

        if (labelText.includes(selectedRoleText)) {
            console.log("✅ TC02 Passed — Selected role updated successfully");
        } else {
            throw new Error(`TC02 Failed — editing target label did not change to ${selectedRoleText}`);
        }
        await driver.sleep(2000); // Wait between cases

        // =====================================================
        // TEST CASE 03: Toggle Individual Checkboxes
        // =====================================================
        console.log("\n========== TC03 ==========");
        console.log("Verify Individual Checkbox Toggle");

        const moduleToTest = "inventory_item";
        const actionToTest = "add";

        const isAddPresent = await isCheckboxPresent(driver, moduleToTest, actionToTest);
        if (!isAddPresent) {
            throw new Error(`Expected '${actionToTest}' checkbox to be present in '${moduleToTest}' row.`);
        }

        const initialState = await getCheckboxState(driver, moduleToTest, actionToTest);
        console.log(`Initial state for ${moduleToTest}_${actionToTest}: ${initialState}`);

        // Click to toggle
        await togglePermissionCheckbox(driver, moduleToTest, actionToTest);

        const toggledState = await getCheckboxState(driver, moduleToTest, actionToTest);
        console.log(`Toggled state for ${moduleToTest}_${actionToTest}: ${toggledState}`);

        if (toggledState !== !initialState) {
            throw new Error("Checkbox state did not flip after clicking");
        }

        // Revert it back for subsequent tests
        await togglePermissionCheckbox(driver, moduleToTest, actionToTest);
        console.log("✅ TC03 Passed — Checkbox toggle state behaves correctly");
        await driver.sleep(2000); // Wait between cases

        // =====================================================
        // TEST CASE 04: Verify Unsupported Actions (Dash Rendering)
        // =====================================================
        console.log("\n========== TC04 ==========");
        console.log("Verify Unsupported Actions Render Dash (-) Instead of Checkbox");

        // 'customer' module only supports 'delete' and 'view'. 'add' and 'change' should be unsupported.
        const isCustomerAddPresent = await isCheckboxPresent(driver, "customer", "add");
        const isCustomerViewPresent = await isCheckboxPresent(driver, "customer", "view");

        console.log(`Is 'customer_add' checkbox present: ${isCustomerAddPresent}`);
        console.log(`Is 'customer_view' checkbox present: ${isCustomerViewPresent}`);

        if (!isCustomerAddPresent && isCustomerViewPresent) {
            console.log("✅ TC04 Passed — Dash rendered correctly and view checkbox exists");
        } else {
            throw new Error("TC04 Failed — Checkboxes mismatch for unsupported customer action");
        }
        await driver.sleep(2000); // Wait between cases

        // =====================================================
        // TEST CASE 05: Verify Row-Level "All" Toggle
        // =====================================================
        console.log("\n========== TC05 ==========");
        console.log("Verify Row-Level 'All' Toggle Switch");

        // Click row all toggle
        const isAllActiveBefore = await isRowAllActive(driver, "inventory_item");
        console.log(`Row-level 'All' active before: ${isAllActiveBefore}`);

        await toggleRowAll(driver, "inventory_item");

        const isAllActiveAfter = await isRowAllActive(driver, "inventory_item");
        console.log(`Row-level 'All' active after: ${isAllActiveAfter}`);

        if (isAllActiveAfter === isAllActiveBefore) {
            throw new Error("Row-level All toggle status class did not update");
        }

        // Verify that all checkboxes in the row are now synchronized (either all true or all false)
        const addState = await getCheckboxState(driver, "inventory_item", "add");
        const changeState = await getCheckboxState(driver, "inventory_item", "change");
        const deleteState = await getCheckboxState(driver, "inventory_item", "delete");
        const viewState = await getCheckboxState(driver, "inventory_item", "view");

        console.log(`Checkbox states -> Add: ${addState}, Change: ${changeState}, Delete: ${deleteState}, View: ${viewState}`);

        if (addState !== isAllActiveAfter || changeState !== isAllActiveAfter || deleteState !== isAllActiveAfter || viewState !== isAllActiveAfter) {
            throw new Error("Checkboxes did not synchronize with the row-level All toggle");
        }

        // Restore back to original state by toggling again
        await toggleRowAll(driver, "inventory_item");
        console.log("✅ TC05 Passed — Row All toggle synchronizes row checkboxes");
        await driver.sleep(2000); // Wait between cases

        // =====================================================
        // TEST CASE 06: Verify Save Changes and Success Toast
        // =====================================================
        console.log("\n========== TC06 ==========");
        console.log("Verify Save Changes Success Toast");

        // Change a permission on 'inventory_item' view
        const initialView = await getCheckboxState(driver, "inventory_item", "view");
        await togglePermissionCheckbox(driver, "inventory_item", "view");

        await clickSaveChanges(driver);
        const saveToastText = await waitForToast(driver);
        if (!saveToastText.includes("updated successfully")) {
            throw new Error(`Expected success toast, got: "${saveToastText}"`);
        }
        await driver.sleep(1500);

        // Revert it back and save to keep DB clean
        await togglePermissionCheckbox(driver, "inventory_item", "view");
        await clickSaveChanges(driver);
        const revertSaveToastText = await waitForToast(driver);
        if (!revertSaveToastText.includes("updated successfully")) {
            throw new Error(`Expected success toast on revert, got: "${revertSaveToastText}"`);
        }

        console.log("✅ TC06 Passed — Permissions save and toast notification verified");
        await driver.sleep(2000); // Wait between cases

        // =====================================================
        // TEST CASE 07: Verify Cancel / Revert Changes
        // =====================================================
        console.log("\n========== TC07 ==========");
        console.log("Verify Cancel / Revert Changes");

        const initialDeleteState = await getCheckboxState(driver, "inventory_item", "delete");
        console.log(`Initial delete permission state: ${initialDeleteState}`);

        // Toggle it
        await togglePermissionCheckbox(driver, "inventory_item", "delete");
        const changedDeleteState = await getCheckboxState(driver, "inventory_item", "delete");
        console.log(`Changed delete permission state: ${changedDeleteState}`);

        // Click Cancel to revert
        await clickCancel(driver);
        const cancelToastText = await waitForToast(driver);
        if (!cancelToastText.includes("reverted back")) {
            throw new Error(`Expected revert toast, got: "${cancelToastText}"`);
        }
        await driver.sleep(1500);

        // Check if state is reverted
        const revertedDeleteState = await getCheckboxState(driver, "inventory_item", "delete");
        console.log(`Reverted delete permission state: ${revertedDeleteState}`);

        if (revertedDeleteState === initialDeleteState) {
            console.log("✅ TC07 Passed — Changes successfully reverted to saved state");
        } else {
            throw new Error("TC07 Failed — Cancel did not revert modified permission checkboxes");
        }

        console.log("\n🎉 All Roles & Permissions Test Cases Passed Successfully!");
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
                console.log("Could not retrieve page body text:", (e as Error).message);
            }

            try {
                const logs = await driver.manage().logs().get("browser");
                console.log("--- Browser Console Logs ---");
                for (const entry of logs) {
                    console.log(`[${entry.level.name}] ${entry.message}`);
                }
                console.log("-----------------------------\n");
            } catch (e) {
                console.log("Could not retrieve browser logs:", (e as Error).message);
            }
        }
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

permissionsTest();
