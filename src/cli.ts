#!/usr/bin/env node

import { adminCommand } from "./cmd/handler.js";

adminCommand().parse();
