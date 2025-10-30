#!/bin/bash

# dbt Helper Script for Lightdash Docker Environment
# Usage: ./dbt-helper.sh [command]

set -e  # Exit on error

CONTAINER_NAME="lightdash-lightdash-1"
DBT_PROJECT_DIR="/usr/app/dbt/bratrax"
DBT_PROFILES_DIR="/usr/app/dbt/bratrax"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run dbt command in docker
run_dbt() {
    echo -e "${BLUE}Running: dbt $@${NC}"
    docker exec -it $CONTAINER_NAME dbt \
        "$@" \
        --project-dir $DBT_PROJECT_DIR \
        --profiles-dir $DBT_PROFILES_DIR
}

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: Container $CONTAINER_NAME is not running${NC}"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

# Main menu
case "${1:-help}" in
    "run-lightdash")
        echo -e "${GREEN}Running models created by Lightdash...${NC}"
        run_dbt run --select tag:created-by-lightdash
        echo -e "${GREEN}✓ Done!${NC}"
        ;;
    
    "run-all")
        echo -e "${YELLOW}Running ALL dbt models...${NC}"
        run_dbt run
        echo -e "${GREEN}✓ Done!${NC}"
        ;;
    
    "run")
        echo -e "${GREEN}Running specific model: $2${NC}"
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a model name${NC}"
            echo "Usage: ./dbt-helper.sh run <model_name>"
            exit 1
        fi
        run_dbt run --select "$2"
        echo -e "${GREEN}✓ Done!${NC}"
        ;;
    
    "compile")
        echo -e "${GREEN}Compiling dbt project...${NC}"
        run_dbt compile
        echo -e "${GREEN}✓ Done!${NC}"
        ;;
    
    "test")
        echo -e "${GREEN}Running dbt tests...${NC}"
        run_dbt test
        echo -e "${GREEN}✓ Done!${NC}"
        ;;
    
    "deps")
        echo -e "${GREEN}Installing dbt dependencies...${NC}"
        run_dbt deps
        echo -e "${GREEN}✓ Done!${NC}"
        ;;
    
    "debug")
        echo -e "${GREEN}Running dbt debug...${NC}"
        run_dbt debug
        ;;
    
    "ls")
        echo -e "${GREEN}Listing dbt models...${NC}"
        run_dbt ls
        ;;
    
    "ls-lightdash")
        echo -e "${GREEN}Listing models created by Lightdash...${NC}"
        run_dbt ls --select tag:created-by-lightdash
        ;;
    
    "shell")
        echo -e "${GREEN}Opening shell in dbt container...${NC}"
        docker exec -it $CONTAINER_NAME bash
        ;;
    
    "custom")
        shift  # Remove first argument
        echo -e "${GREEN}Running custom dbt command...${NC}"
        run_dbt "$@"
        ;;
    
    "help"|*)
        echo -e "${BLUE}dbt Helper Script for Lightdash${NC}"
        echo ""
        echo "Usage: ./dbt-helper.sh [command]"
        echo ""
        echo "Commands:"
        echo "  ${GREEN}run-lightdash${NC}    - Run only models created by Lightdash"
        echo "  ${GREEN}run-all${NC}          - Run ALL dbt models"
        echo "  ${GREEN}run <model>${NC}      - Run a specific model"
        echo "  ${GREEN}compile${NC}          - Compile dbt project"
        echo "  ${GREEN}test${NC}             - Run dbt tests"
        echo "  ${GREEN}deps${NC}             - Install dbt dependencies"
        echo "  ${GREEN}debug${NC}            - Run dbt debug"
        echo "  ${GREEN}ls${NC}               - List all models"
        echo "  ${GREEN}ls-lightdash${NC}     - List Lightdash models"
        echo "  ${GREEN}shell${NC}            - Open bash shell in container"
        echo "  ${GREEN}custom <args>${NC}    - Run custom dbt command"
        echo ""
        echo "Examples:"
        echo "  ./dbt-helper.sh run-lightdash"
        echo "  ./dbt-helper.sh run cod_test_2"
        echo "  ./dbt-helper.sh custom run --select models/example/*"
        ;;
esac

#run with dbt-helper run-lightdash