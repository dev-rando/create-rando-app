# create-rando-app

Create a new Dev Rando challenge app with ease!

## What is the Dev Rando Challenge?

The Dev Rando Challenge is inspired by game randomizers, particularly those for classics like The Legend of Zelda: Ocarina of Time. It applies this concept to coding, challenging developers to build something with randomly assigned dependencies. For more information, visit the [Dev Rando Challenge website](https://dev-rando.vercel.app/).

## Usage

To create a new Dev Rando challenge app, run:

```bash
npx create-rando-app
```

Follow the prompts to set up your project.

## Features

- Fetches the current Dev Rando challenge
- Creates a new project with randomized dependencies
- Initializes a git repository (optional)
- Installs dependencies (optional)

## Project Structure

After running `create-rando-app`, your project will have the following structure:

```
my-rando-app/
├── package.json
├── devrando.config.json
└── .gitignore
```

- `package.json`: Contains the randomized dependencies for your challenge. 
- `devrando.config.json`: Includes metadata about the challenge. Include this file in your repo to help with debugging issues and for searchability if publicly publishing to GitHub.
- `.gitignore`: Pre-configured to ignore `node_modules`

## Challenge Rules

1. Build something using only the provided dependencies
2. No adding, removing, or bumping dependencies (`npm prepare` / `npm verify-deps` will fail inside the project)
3. Be creative and have fun! 

## Contributing

If you have ideas or suggestions for improving create-rando-app, please open an issue or submit a pull request.

## Disclaimer

As stated on the [Dev Rando Challenge website](https://dev-rando.vercel.app/):

> This is the one serious section here: no warranty, no guarantees are made as to the functionality or interoperability of the dependencies in the challenge. You should not use the challenge dependencies in a production environment.

Happy coding!