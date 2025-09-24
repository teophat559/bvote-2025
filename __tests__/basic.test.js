// Basic test to check Jest setup
// Using Jest global functions (available by default)

describe("Basic Test Suite", () => {
  it("should run basic test", () => {
    expect(true).toBe(true);
  });

  it("should test basic math", () => {
    expect(2 + 2).toBe(4);
    expect(5 * 3).toBe(15);
  });

  it("should test string operations", () => {
    const str = "Hello World";
    expect(str.toUpperCase()).toBe("HELLO WORLD");
    expect(str.toLowerCase()).toBe("hello world");
  });

  it("should test array operations", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
    expect(arr.includes(3)).toBe(true);
    expect(arr.includes(6)).toBe(false);
  });

  it("should test object operations", () => {
    const obj = { name: "Test", age: 25 };
    expect(obj.name).toBe("Test");
    expect(obj.age).toBe(25);
    expect(Object.keys(obj)).toEqual(["name", "age"]);
  });

  it("should test async operations", async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const start = Date.now();
    await delay(100);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(100);
  });
});
