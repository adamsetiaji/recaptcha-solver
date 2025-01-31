import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const randomDelay = async (min, max) => {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
};

export class RecaptchaSolver {
    constructor() {
        this.registrationUrl = 'https://surfe.be/register';
        this.extensions = [
            path.join(__dirname, "../../libs/rektCaptcha"),
        ];
        this.retryCount = 3;
        this.retryDelay = 5000;
    }

    async initBrowser() {
        const browserOptions = {
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--start-maximized',
                '--disable-blink-features=AutomationControlled',
                '--ignore-certificate-errors',
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
                '--password-store=basic'
            ],
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ignoreHTTPSErrors: true,
            bypassCSP: true
        };

        // Add extensions if they exist
        if (this.extensions.length > 0) {
            const disableExtensionsExcept = this.extensions.join(',');
            const loadExtensions = this.extensions.join(',');
            browserOptions.args.push(
                `--disable-extensions-except=${disableExtensionsExcept}`,
                `--load-extension=${loadExtensions}`
            );
        }

        console.log('Launching browser with display:', process.env.DISPLAY);
        return await chromium.launchPersistentContext('', browserOptions);
    }

    async handleRecaptcha(page) {
        console.log('Waiting for reCAPTCHA to be checked...');
        let attempt = 0;

        while (attempt < this.retryCount) {
            try {
                await page.waitForSelector('iframe[title="reCAPTCHA"]', {
                    timeout: 10000,
                    state: 'attached'
                });

                const recaptchaFrame = page.frameLocator('iframe[title="reCAPTCHA"]');
                console.log('iframe reCAPTCHA Found');

                await recaptchaFrame.locator('#recaptcha-anchor').waitFor({
                    state: 'visible',
                    timeout: 10000
                });

                await randomDelay(1000, 2000);
                await recaptchaFrame.locator('#recaptcha-anchor').click();

                // Wait for the reCAPTCHA to be solved
                await recaptchaFrame.locator('#recaptcha-anchor[aria-checked="true"]').waitFor({
                    timeout: 120000
                });

                console.log('reCAPTCHA successfully checked!');

                // Get reCAPTCHA response token
                const gRecaptchaResponse = await page.evaluate(() => {
                    const gRecaptchaValue = document.querySelector('#g-recaptcha-response');
                    return gRecaptchaValue ? gRecaptchaValue.value : null;
                });

                if (gRecaptchaResponse) {
                    console.log('Got reCAPTCHA response');
                    return gRecaptchaResponse;
                }

                throw new Error('No reCAPTCHA response found');

            } catch (error) {
                attempt++;
                console.log(`reCAPTCHA attempt ${attempt} failed:`, error);
                
                if (attempt < this.retryCount) {
                    console.log(`Waiting ${this.retryDelay/1000} seconds before retrying...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }

        throw new Error('Failed to handle reCAPTCHA after maximum attempts');
    }

    async fillForm(page) {
        const userData = {
            name: 'sean37585',
            email: 'sean37585@margodam.space',
            password: 'GunungSumbing@2017'
        };

        try {
            // Wait for form fields to be present
            await page.waitForSelector('input[name="login"]', { timeout: 10000 });
            await page.waitForSelector('input[name="email"]', { timeout: 10000 });
            await page.waitForSelector('input[name="password"]', { timeout: 10000 });

            // Fill form with random delays
            await randomDelay(1000, 2000);
            await page.fill('input[name="login"]', userData.name);
            
            await randomDelay(500, 1500);
            await page.fill('input[name="email"]', userData.email);
            
            await randomDelay(700, 1700);
            await page.fill('input[name="password"]', userData.password);
            
            await randomDelay(500, 1000);
            await page.keyboard.press("Enter");

            console.log('Form filled successfully');
        } catch (error) {
            console.error('Error filling form:', error);
            throw error;
        }
    }

    async solve() {
        let browser;
        try {
            console.log('Initializing browser...');
            browser = await this.initBrowser();
            const page = await browser.newPage();

            console.log(`Navigating to ${this.registrationUrl}`);
            await page.goto(this.registrationUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            console.log('Page loaded');

            await this.fillForm(page);
            const recaptchaToken = await this.handleRecaptcha(page);

            return {
                success: 1,
                message: "ready",
                gRecaptchaResponse: recaptchaToken
            };

        } catch (error) {
            console.error('Error in solve:', error);
            return {
                success: 0,
                message: "failed",
                error: error.message
            };
        } finally {
            if (browser) {
                await browser.close().catch(e => console.log('Error closing browser:', e));
            }
        }
    }
}