const fs = require("fs");
const file = process.argv[2];
const fileContent = fs.readFileSync(file, "utf8").toString();
const rows = fileContent.split("\n").filter(Boolean);
const rowsWithoutHeader = rows.slice(1);
const extract = (row) => {
  const segs = row.trim().split("\t");
  const type = segs[1];
  const category = `${segs[2].split("").slice(1).join("").trim()}`;
  const account = parseFloat(segs[3]);
  const desc = segs[4].split("；")[0].trim();
  return { type, category, desc, account };
};
const dataDetail = rowsWithoutHeader.map(extract);
const fixing = (num) => Math.round(num * 100) / 100;
const key = {
  all: "总计",
  detail: "明细",
  out: "支出",
  in: "收入",
};
const groupedData = dataDetail.reduce(
  (prev, cur) => {
    const group =
      prev[cur.type][cur.category] ??
      (prev[cur.type][cur.category] = {
        [key.all]: 0,
        [key.detail]: {},
      });
    group[key.all] = fixing(group[key.all] + cur.account);
    group[key.detail][cur.desc] = fixing(
      (group[key.detail][cur.desc] ?? 0) + cur.account
    );
    return prev;
  },
  {
    [key.out]: {},
    [key.in]: {},
  }
);
const csvData = Object.entries(groupedData).flatMap(([type, categories]) =>
  Object.entries(categories).flatMap(
    ([category, { [key.all]: all, [key.detail]: detail }]) => {
      const items = Object.entries(detail).map(([desc, account]) => [
        desc,
        account,
      ]);
      items.sort((a, b) => b[1] - a[1]);
      return [
        [type, category, "", all].join(","),
        ...items.map(([desc, account]) => ["", "", desc, account].join(",")),
      ];
    }
  )
);
fs.writeFileSync(file.replace(".csv", "-done.csv"), csvData.join("\n"));
