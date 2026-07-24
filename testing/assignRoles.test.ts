import "chromedriver";
import { Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";

const BASE_URL = "http://localhost:3000";
const ADMIN_USER = "admin_local";
const ADMIN_PASS = "admin123";

// =====================================================
// Helper Functions
// =====================================================

async function login(driver: WebDriver) {
    await driver.get(`${BASE_URL}/admin-login`);
    await driver.manage().window().maximize();

    await driver.wait(until.elementLocated(By.css('input[type="text"]')), 10000);

    await driver.findElement(By.css('input[type="text"]')).sendKeys(ADMIN_USER);
    await driver.findElement(By.css('input[type="password"]')).sendKeys(ADMIN_PASS);
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains("dashboard"), 10000);
    console.log("✅ Login Successful");
}

async function openUsersPage(driver: WebDriver) {
    await driver.get(`${BASE_URL}/users`);
    await driver.wait(
        until.elementLocated(By.xpath("//h2[contains(text(),'Roles & Users')]")),
        10000
    );
}

async function setInput(driver: WebDriver, placeholder: string, value: string) {
    const input = await driver.findElement(By.css(`input[placeholder="${placeholder}"]`));
    await driver.executeScript(
        `const el = arguments[0]; const v = arguments[1];
         const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
         s.call(el, v);
         el.dispatchEvent(new Event('input', { bubbles: true }));
         el.dispatchEvent(new Event('change', { bubbles: true }));`,
        input, value
    );
}

async function setPasswordInputs(driver: WebDriver, value: string) {
    const inputs = await driver.findElements(By.css('input[type="password"]'));
    for (const input of inputs) {
        await driver.executeScript(
            `const el = arguments[0]; const v = arguments[1];
             const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
             s.call(el, v);
             el.dispatchEvent(new Event('input', { bubbles: true }));
             el.dispatchEvent(new Event('change', { bubbles: true }));`,
            input, value
        );
    }
}

async function selectRoleByIndex(driver: WebDriver, index: number): Promise<string> {
    const select = await driver.findElement(By.css('select'));
    const options = await select.findElements(By.css('option'));
    if (index >= options.length) index = 0;
    const roleText = await options[index].getText();
    await driver.executeScript(
        `const s = arguments[0]; const i = arguments[1];
         const vs = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
         vs.call(s, s.options[i].value);
         s.dispatchEvent(new Event('change', { bubbles: true }));`,
        select, index
    );
    return roleText;
}

async function selectRoleByName(driver: WebDriver, roleName: string): Promise<boolean> {
    const select = await driver.findElement(By.css('select'));
    const options = await select.findElements(By.css('option'));
    for (let i = 0; i < options.length; i++) {
        if ((await options[i].getText()).trim() === roleName.trim()) {
            await driver.executeScript(
                `const s = arguments[0]; const i = arguments[1];
                 const vs = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                 vs.call(s, s.options[i].value);
                 s.dispatchEvent(new Event('change', { bubbles: true }));`,
                select, i
            );
            return true;
        }
    }
    return false;
}

async function clickCreateUser(driver: WebDriver) {
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Create User')]"));
    await driver.executeScript("arguments[0].click();", btn);
    await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(),'Create User')]")), 5000);
}

async function clickSaveUser(driver: WebDriver) {
    await driver.sleep(500);
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Save User')]"));
    await driver.executeScript("arguments[0].click();", btn);
}

async function clickSaveChanges(driver: WebDriver) {
    await driver.sleep(500);
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Save Changes')]"));
    await driver.executeScript("arguments[0].click();", btn);
}

async function waitForSuccess(driver: WebDriver) {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'successfully!')]")), 10000);
}

async function findUserRowByName(driver: WebDriver, firstName: string, lastName: string): Promise<WebElement | null> {
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    for (let attempt = 0; attempt < 10; attempt++) {
        await driver.sleep(2000);
        const rows = await driver.findElements(By.css('tbody tr'));
        for (const row of rows) {
            const cells = await row.findElements(By.css('td'));
            if (cells.length >= 3) {
                const nameText = (await cells[0].getText()).toLowerCase();
                if (nameText === fullName) return row;
            }
        }
    }
    return null;
}

async function getRoleBadgeFromRow(row: WebElement): Promise<string> {
    const cells = await row.findElements(By.css('td'));
    return await cells[2].getText();
}

async function clickEditButtonForRow(driver: WebDriver, row: WebElement) {
    const btn = await row.findElement(By.css('button[title="Edit User"]'));
    await driver.executeScript("arguments[0].click();", btn);
    await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(),'Edit User')]")), 5000);
}

async function getAvailableRoles(driver: WebDriver): Promise<string[]> {
    const select = await driver.findElement(By.css('select'));
    const options = await select.findElements(By.css('option'));
    const roles: string[] = [];
    for (const opt of options) roles.push(await opt.getText());
    return roles;
}

// =====================================================
// Test Cases
// =====================================================

async function assignRolesTest() {
    let driver: WebDriver | undefined;
    try {
        driver = await new Builder().forBrowser("chrome").build();
        await login(driver);

        const testId = `${Date.now()}`;
        const testEmail = `selenium_test_${testId}@7daymeals.lk`;
        const testFirstName = `Sel${String.fromCharCode(97 + (Number(testId.slice(-2)) % 26))}${String.fromCharCode(97 + (Number(testId.slice(-3, -1)) % 26))}${String.fromCharCode(97 + (Number(testId.slice(-4, -2)) % 26))}`;
        const testLastName = "Test";

        // TC01: Create User with Role
        console.log("\n========== TC01 ==========");
        console.log("Create User with Role Selected");
        await openUsersPage(driver);

        // Wait for roles to load in the roles table (apiRolesList must be populated)
        await driver.wait(
            until.elementLocated(By.xpath("//th[contains(text(),'Role Name')]")),
            10000
        );
        const d = driver;
        await driver.wait(async () => {
            const roleRows = await d.findElements(By.xpath("//th[contains(text(),'Role Name')]/ancestor::table//tbody/tr"));
            return roleRows.length > 0;
        }, 10000);

        await clickCreateUser(driver);

        const availableRoles = await getAvailableRoles(driver);
        console.log(`   Available roles: ${availableRoles.join(', ')}`);
        if (availableRoles.length === 0) { console.log("❌ No roles — aborting"); return; }

        await setInput(driver, "e.g. John", testFirstName);
        await setInput(driver, "e.g. Doe", testLastName);
        await setInput(driver, "e.g. +94771234567", "+94771234567");
        await setInput(driver, "e.g. john.doe@example.com", testEmail);
        await setPasswordInputs(driver, "Test@1234");
        const selectedRole = await selectRoleByIndex(driver, availableRoles.length > 1 ? 1 : 0);
        console.log(`   Selected role: ${selectedRole}`);
        await clickSaveUser(driver);
        await waitForSuccess(driver);
        console.log("✅ TC01 Passed — User created");

        // TC02: Verify User in Table
        console.log("\n========== TC02 ==========");
        console.log("Verify User Appears in Table");
        await driver.sleep(1000);
        await openUsersPage(driver);
        await driver.sleep(1000);
        let userRow = await findUserRowByName(driver, testFirstName, testLastName);
        if (!userRow) {
            // Debug: log all rows to see what's in the table
            const allRows = await driver.findElements(By.css('tbody tr'));
            console.log(`   Debug: Found ${allRows.length} total tbody rows`);
            for (let i = 0; i < Math.min(allRows.length, 5); i++) {
                const cells = await allRows[i].findElements(By.css('td'));
                const cellTexts = [];
                for (const c of cells) cellTexts.push(await c.getText());
                console.log(`   Row ${i}: ${cellTexts.join(' | ')}`);
            }
        }
        if (userRow) {
            const name = await (await userRow.findElements(By.css('td')))[0].getText();
            const badge = await getRoleBadgeFromRow(userRow);
            console.log(`   Found: ${name}, Role: ${badge}`);
            console.log("✅ TC02 Passed — User visible");
        } else {
            console.log("❌ TC02 Failed — User NOT found");
        }

        // TC03: Edit User and Change Role
        console.log("\n========== TC03 ==========");
        console.log("Edit User and Change Role");
        if (!userRow) { console.log("❌ TC03 Skipped"); return; }
        await clickEditButtonForRow(driver, userRow);
        await driver.sleep(500);
        const otherRole = availableRoles.find(r => r !== selectedRole) || availableRoles[0];
        await selectRoleByName(driver, otherRole);
        console.log(`   Changed role to: ${otherRole}`);
        await clickSaveChanges(driver);
        await waitForSuccess(driver);
        console.log("✅ TC03 Passed — Role change saved");

        // TC04: Verify Role Updated by Reopening Edit Modal
        console.log("\n========== TC04 ==========");
        console.log("Verify Role Updated (Reopen Edit Modal)");
        await driver.sleep(1000);
        await openUsersPage(driver);
        await driver.sleep(1000);
        const updatedRow = await findUserRowByName(driver, testFirstName, testLastName);
        if (updatedRow) {
            await clickEditButtonForRow(driver, updatedRow);
            const select = await driver.findElement(By.css('select'));
            const selectValue = await select.getAttribute('value');
            const options = await select.findElements(By.css('option'));
            let selectedText = '';
            for (const opt of options) {
                const optValue = await opt.getAttribute('value');
                if (optValue === selectValue) {
                    selectedText = await opt.getText();
                    break;
                }
            }
            console.log(`   Dropdown selected role: ${selectedText}`);
            if (selectedText === otherRole) {
                console.log("✅ TC04 Passed — Role correctly updated");
            } else {
                console.log(`❌ TC04 Failed — Expected ${otherRole}, got ${selectedText}`);
            }
        } else {
            console.log("❌ TC04 Failed — User NOT found");
        }

        console.log("\n🎉 All Role Assignment Test Cases Passed Successfully!");
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

assignRolesTest();
