import { Builder, By, Key, WebDriver, WebElement } from 'selenium-webdriver';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';

const __dirname = path.resolve();

console.log(__dirname + '/.env');
dotenv.config({ path: __dirname + '/.env' });
interface UserJSON {
  latestUsedUserPos: number;
  failedusers: string[];
  users: string[];
}
const raw = fs.readFileSync('data/test.json');
const usersJson: UserJSON = JSON.parse(raw.toString());
function timer(max?: number, min?: number) {
  const _max = max ? max : 5;
  return new Promise((resolve) => setTimeout(resolve, min ? Math.floor(Math.random() * (_max * 1000 - min * 1000 + 1)) : _max * 1000));
}

class AppWebDriver {
  driver: WebDriver;
  async Auth(username: string, password: string) {
    this.driver = await new Builder().forBrowser('chrome').build();
    const driver: WebDriver = this.driver;
    try {
      await driver.get('https://www.instagram.com/');
      await timer(5);
      await driver.findElement(By.name('username')).sendKeys(username);
      await timer(1);
      await driver.findElement(By.name('password')).sendKeys(password);
      await timer(1);
      await driver.findElement(By.xpath('/html/body/div[1]/section/main/article/div[2]/div[1]/div[2]/form/div/div[3]/button/div')).click();
      try {
        await timer(3);
        await driver.findElement(By.xpath('/html/body/div[1]/section/main/article/div[2]/div[1]/div[2]/form/div[2]/p'));
        this.Auth(username, password);
      } catch {
        //
      }
    } catch (err) {
      console.log(err);
    }
  }
  async sendMessageToUsers(users: Array<string>, message: string) {
    const driver: WebDriver = this.driver;

    try {
      // Clicking Message Envelop Icon on Nav bar
      await driver.findElement(By.xpath('/html/body/div[1]/section/nav/div[2]/div/div/div[3]/div/div[2]/a')).click();
      await timer(5);
      // Clicking On Not now on modal that appears in beginning
      await driver.findElement(By.xpath('/html/body/div[6]/div/div/div/div[3]/button[2]')).click();
      // get lated used index if exist cause sometimes app crashes and we dont want it start from beginning and select the first user again
      let index = usersJson.latestUsedUserPos ? usersJson.latestUsedUserPos : 0;
      const _users = users.slice(index);
      for (const user of _users) {
        // waiting
        await timer(3);

        // open new message modal
        await driver.findElement(By.xpath('/html/body/div[1]/section/div/div[2]/div/div/div[1]/div[1]/div/div[3]/button')).click();

        await timer(3);

        // select input and writing username
        const input = await driver.findElement(By.xpath('/html/body/div[6]/div/div/div[2]/div[1]/div/div[2]/input'));
        input.click();
        input.sendKeys(user);

        await timer(3);
        // saving current
        usersJson.latestUsedUserPos = usersJson.users.findIndex((userfromArr) => userfromArr === user);
        await fs.writeFile('data/users.json', JSON.stringify(usersJson), () => '');

        // try to find user in results
        try {
          await driver.findElement(By.xpath('/html/body/div[6]/div/div/div[2]/div[2]/div/div/div[3]/button')).click();
        } catch {
          // if user doesnot exit push to failed users array and click X button and go to next iteration
          usersJson.failedusers.push(usersJson.users[index]);
          await fs.writeFile('data/users.json', JSON.stringify(usersJson), () => '');
          await driver.findElement(By.xpath('/html/body/div[6]/div/div/div[1]/div/div[2]/div/button')).click();
          continue;
        }
        // if code reach here means he found user and he selected it
        // so we click Next Button
        await driver.findElement(By.xpath('/html/body/div[6]/div/div/div[1]/div/div[3]/div/button')).click();
        await timer(3);
        // Select text area
        const textArea: WebElement = await driver.findElement(
          By.xpath('/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/div/div[2]/textarea'),
        );
        textArea.click();
        // Send Message
        textArea.sendKeys(message, Key.ENTER);
        // Going to next user
        index++;
      }
    } catch (err) {
      driver.quit();
    }
  }
}

const login = {
  username: process.env.Instagram_Username,
  password: process.env.Instagram_Password,
};
async function RunDriver(login: { username: string; password: string }, loginUsers: Array<string>) {
  const instance = new AppWebDriver();
  await instance.Auth(login.username, login.password);
  await timer();
  await instance.sendMessageToUsers(loginUsers, 'hi');
}
RunDriver(login, usersJson.users);

// const slicesNum = logins.length;
// const numOfItemsOnEachSlice = Math.ceil(usersJson.users.length / slicesNum);
// const slices = [];
// let start = 0;
// for (let curSlice = 0; curSlice < slicesNum; curSlice++) {
//   if (start + numOfItemsOnEachSlice >= usersJson.users.length) {
//     slices.push(usersJson.users.slice(start));
//   } else {
//     slices.push(usersJson.users.slice(start, start + numOfItemsOnEachSlice));
//   }
//   start = start + numOfItemsOnEachSlice;
// }

// for (const [index, slice] of slices.entries()) {
//   RunDriver(logins[index], slice);
// }
