require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const PORT = process.env.PORT || 3000;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//"mongodb://localhost:27017/todoListDB"

mongoose.connect(
  process.env.MONGODB_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome To Your TodoList!",
});
const item2 = new Item({
  name: "Hit The + Button to add a New Item",
});
const item3 = new Item({
  name: "<----- Hit This To Delete An Item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default Items Added Successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:todo", function (req, res) {
  const route = _.capitalize(req.params.todo);

  List.findOne({ name: route }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a New List
        const list = new List({
          name: route,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + route);
      } else {
        //Show An Existing List
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemToAdd = req.body.newItem;
  const listName = req.body.list;
  const itemAdd = new Item({
    name: itemToAdd,
  });

  if (listName === "Today") {
    itemAdd.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(itemAdd);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const itemToDelete = req.body.deleteItem;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemToDelete, function (err) {
      if (!err) {
        console.log("Item Deleted Successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: itemToDelete } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(PORT, function () {
  console.log(`Server Started On http://localhost:${PORT}`);
});
