# PACKAGE MANAGER: PNPM 
### COMMANDS 
- pnpm add <shared-library-name> --filter <app-name-where-we-wants-to-add-the-shared-ui-lib> --workspace
`Description:` this command is used to add the `shared-libraries` to the apps from the monorepos 

- pnpm add --filter <app-or-package-name> <dependency-name>
`Description:` this command is used to add or download depens to any app or package 

- pnpm --filter <app-name> <command-whichever-wants-to-run>
`Description: this command is used to run the single command from the targated app 

- pnpm run -r build 
`Description:` this command is used to build the entire monorepo's packages & apps at once

# NX -- 

- pnpm add nx -D -w
`Description:` this command is used to add the nx to the existing project, -w flag is to used here to tell the pnpm to set this at root lvl

- npx nx <command-for-app> <app-name>
`Description:` this command is used to run any command from any targated app within the repo that are managed by `NX`
